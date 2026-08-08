from datetime import date, time
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ComplaintCreate(BaseModel):

    complaint_type: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    crime_category: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    crime_subcategory: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    priority: str = Field(
        default="Medium",
        min_length=1,
        max_length=20,
    )

    incident_date: Optional[date] = None

    incident_time: Optional[time] = None

    location: Optional[str] = None

    description: str = Field(
        ...,
        min_length=1,
    )

    ai_summary: Optional[str] = None

    officer_notes: Optional[str] = None


class ComplaintResponse(BaseModel):

    complaint_id: str

    complaint_number: str

    complaint_type: str

    crime_category: str

    crime_subcategory: str

    priority: str

    incident_date: Optional[date] = None

    incident_time: Optional[time] = None

    location: Optional[str] = None

    description: str

    ai_summary: Optional[str] = None

    officer_notes: Optional[str] = None

    status: str

    model_config = ConfigDict(
        from_attributes=True
    )