#!/usr/bin/env python3
"""
CrimeOS Image Ingestion Service
===============================
This module provides a production-ready service and command-line interface (CLI)
for extracting structured crime investigation information from images.

It uses the Google Gemini 2.5 Flash model (via google-generativeai SDK) to
analyze images and extract specific details (people, vehicles, weapons, evidence, etc.)
into a validated JSON structure defined by Pydantic models.

Supported formats: JPG, JPEG, PNG, WEBP.
"""

import argparse
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

# Third-party dependencies
try:
    from PIL import Image
except ImportError:
    print("Error: The 'Pillow' library is required. Install it using 'pip install Pillow'.", file=sys.stderr)
    sys.exit(1)

try:
    from pydantic import BaseModel, Field, ValidationError
except ImportError:
    print("Error: The 'pydantic' library is required. Install it using 'pip install pydantic'.", file=sys.stderr)
    sys.exit(1)

try:
    import google.generativeai as genai
    from google.api_core import exceptions as google_exceptions
except ImportError:
    print("Error: The 'google-generativeai' library is required. Install it using 'pip install google-generativeai'.", file=sys.stderr)
    sys.exit(1)

# Configure logging
logger = logging.getLogger("CrimeOS.ImageService")


# =====================================================================
# Pydantic Schemas for Validation (Requirement 15 & 7)
# =====================================================================

class DocumentMeta(BaseModel):
    """Metadata regarding the source file and analysis configuration."""
    source_file: str = Field(
        ..., 
        description="The source filename or path of the analyzed image."
    )
    image_width: int = Field(
        ..., 
        description="Width of the image in pixels."
    )
    image_height: int = Field(
        ..., 
        description="Height of the image in pixels."
    )
    analysis_model: str = Field(
        "gemini-2.5-flash", 
        description="The Gemini model used for the visual analysis."
    )


class SceneDetails(BaseModel):
    """Environmental and situational details of the crime scene."""
    summary: str = Field(
        ..., 
        description="A concise yet comprehensive summary of the visual scene."
    )
    environment: str = Field(
        ..., 
        description="General description of the environment (e.g., urban, rural, forest, highway, industrial)."
    )
    location_type: str = Field(
        ..., 
        description="Type of location (e.g., parking lot, convenience store, residential alleyway, bedroom)."
    )
    indoor_outdoor: str = Field(
        ..., 
        description="Indication of whether the scene is indoors, outdoors, or a mix of both."
    )
    lighting: str = Field(
        ..., 
        description="Lighting conditions (e.g., daylight, artificial streetlights, low-light, flashing siren lights)."
    )
    weather: str = Field(
        ..., 
        description="Weather conditions visible (e.g., rain, snow, clear, foggy, overcast)."
    )
    time_of_day: str = Field(
        ..., 
        description="Estimated time of day (e.g., morning, afternoon, dusk, night)."
    )


class PersonDetails(BaseModel):
    """Detailed information about a person detected in the image."""
    description: str = Field(
        ..., 
        description="Physical description of the person including clothing, gender, height/build estimate, and age estimate."
    )
    activity: str = Field(
        ..., 
        description="What the person is doing in the scene (e.g., running, holding an object, standing, interacting)."
    )
    suspicious_behavior: Optional[str] = Field(
        None, 
        description="Description of any suspicious actions or behaviors, if applicable."
    )
    location_in_scene: Optional[str] = Field(
        None, 
        description="Approximate location of the person within the frame (e.g., foreground left, near the vehicle)."
    )


class VehicleDetails(BaseModel):
    """Detailed information about a vehicle detected in the image."""
    type: str = Field(
        ..., 
        description="Type of vehicle (e.g., car, SUV, motorcycle, truck, bicycle)."
    )
    color: Optional[str] = Field(
        None, 
        description="Visible color of the vehicle."
    )
    make_model: Optional[str] = Field(
        None, 
        description="Make and model of the vehicle if discernible (e.g., Toyota Camry, Ford F-150)."
    )
    license_plate: Optional[str] = Field(
        None, 
        description="License plate number and state/jurisdiction if readable."
    )
    suspicious_features: Optional[str] = Field(
        None, 
        description="Any suspicious characteristics (e.g., missing plates, broken windows, running engine without driver)."
    )
    location_in_scene: Optional[str] = Field(
        None, 
        description="Location of the vehicle in the frame."
    )


class ObjectDetails(BaseModel):
    """Detailed information about an important object in the scene."""
    name: str = Field(
        ..., 
        description="Name of the object."
    )
    description: str = Field(
        ..., 
        description="Visual description of the object (color, size, state)."
    )
    location_in_scene: Optional[str] = Field(
        None, 
        description="Location of the object in the frame."
    )
    relevance_to_investigation: Optional[str] = Field(
        None, 
        description="How or why this object is relevant to a potential police investigation."
    )


class TextDetection(BaseModel):
    """Legible text extracted from the scene."""
    text: str = Field(
        ..., 
        description="The readable text exactly as it appears in the image."
    )
    source_type: str = Field(
        ..., 
        description="Source of the text (e.g., license plate, storefront sign, document text, apparel, road sign)."
    )
    confidence: Optional[str] = Field(
        None, 
        description="Estimated readability or confidence level (e.g., clear, partially obscured, blurry)."
    )


class BuildingDetails(BaseModel):
    """Details about buildings or structures in the scene."""
    type: str = Field(
        ..., 
        description="Type of building/structure (e.g., warehouse, residential house, commercial store, fence)."
    )
    description: str = Field(
        ..., 
        description="Visual details including structural condition, color, and key features."
    )
    visible_signs_or_details: Optional[str] = Field(
        None, 
        description="Any notable signage, entry points, or damage on the building."
    )


class AnimalDetails(BaseModel):
    """Details about animals in the scene."""
    type: str = Field(
        ..., 
        description="Type or breed of animal (e.g., dog, cat, horse)."
    )
    description: str = Field(
        ..., 
        description="Visual description and status/activity of the animal."
    )


class WeaponDetails(BaseModel):
    """Details about weapons detected in the scene."""
    type: str = Field(
        ..., 
        description="Type of weapon (e.g., handgun, rifle, knife, blunt object, broken bottle)."
    )
    description: str = Field(
        ..., 
        description="Detailed visual description (color, size, model if visible)."
    )
    location: Optional[str] = Field(
        None, 
        description="Where the weapon is located (e.g., in hand of person 1, on the floor next to the table)."
    )


class EvidenceDetails(BaseModel):
    """Details about potential forensic evidence in the scene."""
    type: str = Field(
        ..., 
        description="Type of potential evidence (e.g., bloodstain, cartridge case, footprint, toolmark, drug paraphernalia)."
    )
    description: str = Field(
        ..., 
        description="Visual appearance and estimated importance level."
    )
    location: Optional[str] = Field(
        None, 
        description="Location of the evidence in the scene."
    )


class TimelineEvent(BaseModel):
    """Chronological event or action inferred from the visual context."""
    time_or_sequence: str = Field(
        ..., 
        description="Time marker or step number (e.g., 'Step 1', 'Estimated 14:30', 'Post-impact')."
    )
    event: str = Field(
        ..., 
        description="Inferred action or event that occurred or is occurring."
    )


class CrimeOSImageAnalysis(BaseModel):
    """The master schema for CrimeOS Image Ingestion Analysis (Requirement 15)."""
    document_meta: DocumentMeta
    scene: SceneDetails
    people: List[PersonDetails] = Field(default_factory=list)
    vehicles: List[VehicleDetails] = Field(default_factory=list)
    objects: List[ObjectDetails] = Field(default_factory=list)
    text_detected: List[TextDetection] = Field(default_factory=list)
    buildings: List[BuildingDetails] = Field(default_factory=list)
    animals: List[AnimalDetails] = Field(default_factory=list)
    weapons: List[WeaponDetails] = Field(default_factory=list)
    evidence: List[EvidenceDetails] = Field(default_factory=list)
    suspicious_observations: List[str] = Field(
        default_factory=list,
        description="List of specific, suspicious visual observations."
    )
    possible_crime_indicators: List[str] = Field(
        default_factory=list,
        description="List of visual cues indicating potential criminal activity."
    )
    timeline: List[TimelineEvent] = Field(
        default_factory=list,
        description="Inferred sequence of events based on visual clues."
    )
    search_keywords: List[str] = Field(
        default_factory=list,
        description="Keywords extracted for database searching and indexing."
    )
    confidence_score: float = Field(
        ..., 
        description="Overall confidence score of the analysis (between 0.0 and 1.0)."
    )


# =====================================================================
# Core Logic & Integration Functions
# =====================================================================

def clean_gemini_output(raw_text: str) -> str:
    """
    Cleans the raw response from the Gemini model. (Requirement 17)
    Strips markdown formatting block backticks (```json ... ```) if present.
    
    Args:
        raw_text: The raw string response from the Gemini API.
        
    Returns:
        The cleaned JSON string ready for parsing.
    """
    text = raw_text.strip()
    
    # Check if the output is wrapped in markdown code block
    if text.startswith("```"):
        # Find the end of the first line (e.g., ```json or ```)
        first_newline = text.find("\n")
        if first_newline != -1:
            prefix = text[:first_newline].strip()
            if prefix in ("```json", "```"):
                text = text[first_newline:].strip()
        
        # Strip trailing code block marker
        if text.endswith("```"):
            text = text[:-3].strip()
            
    return text


def get_gemini_prompt() -> str:
    """
    Returns the highly detailed system prompt for the Gemini vision model.
    Instructs the model on all required extractions. (Requirement 16)
    """
    return (
        "You are an expert crime scene investigator, forensic analyst, and digital evidence specialist. "
        "Your task is to analyze the provided image in detail and extract structured evidence for a police database. "
        "You must output ONLY a valid JSON block complying with the schema provided. "
        "Ensure you detect and include the following items in your analysis:\n"
        "- detect every person: detail their clothing, estimated age, gender, actions, and note if they are suspicious.\n"
        "- detect every vehicle: details like make, model, color, license plate, and any suspicious features.\n"
        "- detect every important object: anything relevant to a crime or incident scene.\n"
        "- detect weapons: handguns, knives, blunt objects, improvised weapons, etc.\n"
        "- detect blood: spots, splatters, pools, or biological stains.\n"
        "- detect smoke: combustion evidence, gaseous clouds.\n"
        "- detect fire: active flames, charred areas.\n"
        "- detect broken glass: windows, windshields, glasses on the floor.\n"
        "- detect damaged property: vandalism, forced entry, dents, fire damage.\n"
        "- detect CCTV cameras: security systems, dashcams, potential recording devices.\n"
        "- detect documents: letters, open files, identification cards, logs.\n"
        "- detect electronic devices: cell phones, computers, surveillance monitors, storage units.\n"
        "- detect readable text: signs, writing on walls, labels, clothing brand names.\n"
        "- detect number plates: vehicles' registration numbers.\n"
        "- detect suspicious activities: abnormal human actions, out-of-place objects, security breaches.\n"
        "- detect evidence useful for police investigation: trace evidence, weapons, context markers.\n"
        "- generate searchable keywords: 8-15 indexing keywords representing the scene.\n"
        "- infer timeline: trace logical progression of events if multiple actions or steps are visually implied.\n"
        "- estimate confidence: rate your visual analysis confidence from 0.0 (unreliable) to 1.0 (absolute certainty).\n\n"
        "CRITICAL RULES:\n"
        "1. Never hallucinate. If an element (like blood, weapons, or animals) is NOT visible, do NOT create dummy items. "
        "Leave the corresponding array empty.\n"
        "2. Do not explain the output. Do not wrap the JSON in Markdown decorators like ```json. Return ONLY valid JSON.\n"
        "3. Follow the Pydantic schema structure exactly."
    )


def process_image(image_path: Union[str, Path]) -> Dict[str, Any]:
    """
    Processes a single image file through Gemini 2.5 Flash Vision. (Requirement 10 & 1)
    Loads the image, configures Gemini API, executes analysis, and validates JSON.
    
    Args:
        image_path: The file path to the target image.
        
    Returns:
        A dictionary containing the validated JSON structure or a structured error object.
    """
    image_path = Path(image_path)
    logger.info(f"Starting analysis for image: {image_path.name}")
    
    # 1. Read API Key (Requirement 2)
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        error_msg = "GEMINI_API_KEY environment variable is not set."
        logger.error(error_msg)
        return {
            "error": {
                "code": "MISSING_API_KEY",
                "message": error_msg,
                "source_file": str(image_path.name)
            }
        }
        
    # Configure generative AI library
    genai.configure(api_key=api_key)
    
    # 2. Open and load image using Pillow
    try:
        if not image_path.exists():
            raise FileNotFoundError(f"File not found: {image_path}")
            
        with Image.open(image_path) as img:
            image_width, image_height = img.size
            # Convert to RGB to verify image validity and prevent palette/transparency issues
            pil_image = img.convert("RGB")
            # Force load image data into memory before context manager exits
            pil_image.verify()
            
        # Re-open for actual generation to ensure PIL object is clean
        pil_image = Image.open(image_path)
        
    except Exception as e:
        error_msg = f"Failed to load or parse image file: {str(e)}"
        logger.error(error_msg)
        return {
            "error": {
                "code": "IMAGE_LOAD_FAILED",
                "message": error_msg,
                "source_file": str(image_path.name)
            }
        }

    # 3. Request analysis from Gemini (Requirement 1)
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = get_gemini_prompt()
        
        logger.info(f"Sending image to Gemini 2.5 Flash Vision API...")
        
        # Configure model parameters
        generation_config = {
            "response_mime_type": "application/json",
        }
        
        response = model.generate_content(
            [pil_image, prompt],
            generation_config=generation_config
        )
        
        raw_text = response.text
        if not raw_text:
            raise ValueError("Gemini returned an empty response.")
            
    except google_exceptions.GoogleAPICallError as e:
        error_msg = f"Gemini API call failed: {str(e)}"
        logger.error(error_msg)
        return {
            "error": {
                "code": "GEMINI_API_CALL_ERROR",
                "message": error_msg,
                "source_file": str(image_path.name)
            }
        }
    except Exception as e:
        error_msg = f"Unexpected error during Gemini analysis: {str(e)}"
        logger.error(error_msg)
        return {
            "error": {
                "code": "ANALYSIS_PIPELINE_ERROR",
                "message": error_msg,
                "source_file": str(image_path.name)
            }
        }
        
    # 4. Automatically clean Gemini output (Requirement 17 & 18)
    cleaned_text = clean_gemini_output(raw_text)
    
    try:
        parsed_json = json.loads(cleaned_text)
    except json.JSONDecodeError as e:
        # If JSON parsing fails, return a structured error object (Requirement 19)
        error_msg = f"JSON decoding failed: {str(e)}"
        logger.error(error_msg)
        logger.debug(f"Raw output that failed parsing:\n{raw_text}")
        return {
            "error": {
                "code": "JSON_PARSING_FAILED",
                "message": error_msg,
                "raw_response": raw_text,
                "source_file": str(image_path.name)
            }
        }
        
    # 5. Populate/correct document_meta in Python
    # This guarantees width, height, and filename are mathematically accurate
    if "document_meta" not in parsed_json or not isinstance(parsed_json["document_meta"], dict):
        parsed_json["document_meta"] = {}
        
    parsed_json["document_meta"].update({
        "source_file": image_path.name,
        "image_width": image_width,
        "image_height": image_height,
        "analysis_model": "gemini-2.5-flash"
    })
    
    # 6. Validate using Pydantic (Requirement 14 & 7)
    try:
        validated_model = CrimeOSImageAnalysis(**parsed_json)
        # Convert back to clean serializable dict
        return validated_model.model_dump()
    except ValidationError as e:
        # Return structured validation error rather than crashing (Requirement 19)
        error_msg = f"Pydantic schema validation failed: {str(e)}"
        logger.error(error_msg)
        return {
            "error": {
                "code": "VALIDATION_FAILED",
                "message": error_msg,
                "validation_errors": e.errors(include_url=False),
                "source_file": str(image_path.name)
            }
        }


# =====================================================================
# Batch Processing Driver
# =====================================================================

def process_batch(
    input_dir: Union[str, Path], 
    output_dir: Optional[Union[str, Path]] = None,
) -> Dict[str, Any]:
    """
    Scans a directory for supported images and processes each sequentially. (Requirement 8 & 9)
    Saves outputs to the output directory if specified, or prints results.
    
    Args:
        input_dir: Directory containing image files.
        output_dir: Directory to store the resulting JSON files.
        
    Returns:
        A batch execution report summary.
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir) if output_dir else None
    
    if not input_path.is_dir():
        raise NotADirectoryError(f"Input path is not a directory: {input_path}")
        
    if output_path:
        output_path.mkdir(parents=True, exist_ok=True)
        
    supported_extensions = {".jpg", ".jpeg", ".png", ".webp"} # Requirement 9
    
    # Find all matching files
    image_files = [
        f for f in input_path.iterdir() 
        if f.is_file() and f.suffix.lower() in supported_extensions
    ]
    
    logger.info(f"Found {len(image_files)} supported images in {input_path}")
    
    results = {
        "batch_meta": {
            "input_directory": str(input_path.absolute()),
            "output_directory": str(output_path.absolute()) if output_path else None,
            "total_files_found": len(image_files),
            "start_time": time.time()
        },
        "processed_files": [],
        "failures": []
    }
    
    success_count = 0
    failure_count = 0
    
    for idx, img_file in enumerate(image_files, 1):
        logger.info(f"[{idx}/{len(image_files)}] Processing {img_file.name}...")
        
        result_dict = process_image(img_file)
        
        # Save output to directory or track failures
        if "error" in result_dict:
            failure_count += 1
            results["failures"].append({
                "file": img_file.name,
                "error": result_dict["error"]
            })
            
            # If an output directory was specified, write the error payload there too
            if output_path:
                out_filename = img_file.stem + "_error.json"
                target_out = output_path / out_filename
                try:
                    with open(target_out, "w", encoding="utf-8") as f:
                        json.dump(result_dict, f, indent=4)
                except Exception as e:
                    logger.error(f"Failed to write error JSON to {target_out}: {e}")
        else:
            success_count += 1
            results["processed_files"].append(img_file.name)
            
            if output_path:
                out_filename = img_file.stem + ".json"
                target_out = output_path / out_filename
                try:
                    with open(target_out, "w", encoding="utf-8") as f:
                        json.dump(result_dict, f, indent=4)
                    logger.info(f"Successfully saved analysis to {target_out}")
                except Exception as e:
                    logger.error(f"Failed to write output JSON to {target_out}: {e}")
            else:
                # No output path specified, print structured JSON to console
                print(f"\n--- Analysis Results for {img_file.name} ---")
                print(json.dumps(result_dict, indent=2))
                print("------------------------------------------\n")
                
    end_time = time.time()
    results["batch_meta"]["end_time"] = end_time
    results["batch_meta"]["duration_seconds"] = round(end_time - results["batch_meta"]["start_time"], 2)
    results["batch_meta"]["successes"] = success_count
    results["batch_meta"]["failures"] = failure_count
    
    logger.info(
        f"Batch processing completed in {results['batch_meta']['duration_seconds']}s. "
        f"Successes: {success_count}, Failures: {failure_count}."
    )
    
    return results


# =====================================================================
# Main Driver and CLI interface (Requirement 11 & 12)
# =====================================================================

def setup_logging(verbose: bool) -> None:
    """
    Sets up the application log level and format.
    
    Args:
        verbose: If True, sets log level to DEBUG; otherwise INFO.
    """
    log_level = logging.DEBUG if verbose else logging.INFO
    log_format = "%(asctime)s [%(levelname)s] %(name)s - %(message)s"
    
    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stderr)
        ]
    )


def main() -> int:
    """
    CLI main entry point matching pdf_to_json.py patterns. (Requirement 11 & 12)
    
    Returns:
        Exit code (0 for success, 1 for failure).
    """
    parser = argparse.ArgumentParser(
        description="Extract structured Crime Investigation JSON data from crime scene and evidence images using Gemini 2.5 Vision."
    )
    parser.add_argument(
        "input_path",
        help="Path to a single image file or a directory of images to process."
    )
    parser.add_argument(
        "-o", "--out",
        default=None,
        help="Path to save the output JSON. If input is a directory, this must be a directory path."
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable detailed diagnostic logging."
    )
    
    args = parser.parse_args()
    setup_logging(args.verbose)
    
    # Check GEMINI_API_KEY requirement early
    if not os.environ.get("GEMINI_API_KEY"):
        logger.error("GEMINI_API_KEY environment variable is not defined. Please set it before running.")
        return 1

    input_path = Path(args.input_path)
    if not input_path.exists():
        logger.error(f"Specified input path does not exist: {input_path}")
        return 1
        
    try:
        if input_path.is_dir():
            # Batch Folder Processing Mode (Requirement 8)
            logger.info(f"Directory detected. Initiating batch processing on: {input_path}")
            batch_summary = process_batch(input_path, args.out)
            
            # Print final batch processing summary statistics
            if args.out:
                summary_file = Path(args.out) / "batch_summary.json"
                try:
                    with open(summary_file, "w", encoding="utf-8") as f:
                        json.dump(batch_summary, f, indent=4)
                    logger.info(f"Saved batch processing summary stats to {summary_file}")
                except Exception as e:
                    logger.error(f"Failed to write summary metadata to {summary_file}: {e}")
            return 0 if batch_summary["batch_meta"]["failures"] == 0 else 1
            
        elif input_path.is_file():
            # Single Image Processing Mode (Requirement 8)
            supported_extensions = {".jpg", ".jpeg", ".png", ".webp"} # Requirement 9
            if input_path.suffix.lower() not in supported_extensions:
                logger.error(
                    f"Unsupported image format: {input_path.suffix}. "
                    f"Supported formats are: {', '.join(supported_extensions)}"
                )
                return 1
                
            result = process_image(input_path)
            
            if "error" in result:
                logger.error(f"Processing failed: {result['error']['message']}")
                # If output path is provided, save the structured error details (Requirement 14)
                if args.out:
                    out_path = Path(args.out)
                    # If out_path is a directory, append default file name
                    if out_path.is_dir() or args.out.endswith("/") or args.out.endswith("\\"):
                        out_path.mkdir(parents=True, exist_ok=True)
                        out_path = out_path / (input_path.stem + "_error.json")
                    with open(out_path, "w", encoding="utf-8") as f:
                        json.dump(result, f, indent=4)
                else:
                    print(json.dumps(result, indent=2))
                return 1
            
            # Save or print successful validation results
            if args.out:
                out_path = Path(args.out)
                if out_path.is_dir() or args.out.endswith("/") or args.out.endswith("\\"):
                    out_path.mkdir(parents=True, exist_ok=True)
                    out_path = out_path / (input_path.stem + ".json")
                
                with open(out_path, "w", encoding="utf-8") as f:
                    json.dump(result, f, indent=4)
                logger.info(f"Saved validated JSON output to {out_path}")
            else:
                # Direct serialization output to stdout
                print(json.dumps(result, indent=2))
            return 0
        else:
            logger.error(f"Invalid input type: {input_path}")
            return 1
            
    except Exception as e:
        logger.critical(f"Unhandled exception in CLI processing execution: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
