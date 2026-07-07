"use client";

import { useState } from "react";

import Stepper from "./Stepper";

import FileUploader from "./upload/FileUploader";

import ComplaintDetails from "./steps/ComplaintDetails";

import { ComplaintData } from "./types";

export default function ComplaintWizard(){

const [step,setStep]=useState(1);

const [form,setForm]=useState<ComplaintData>({

complaintType:"",

category:"",

priority:"Medium",

incidentDate:"",

incidentTime:"",

location:"",

description:"",

aiSummary:"",

officerNotes:""

});

return(

<div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">

<h1 className="text-3xl font-bold">

Register Complaint

</h1>

<div className="mt-8">

<Stepper currentStep={step}/>

</div>

<div className="mt-10">

{

step===1&&

<FileUploader/>

}

{

step===2&&

<ComplaintDetails

form={form}

setForm={setForm}

/>

}

</div>

<div className="flex justify-between mt-10">

<button

disabled={step===1}

onClick={()=>setStep(step-1)}

className="bg-gray-300 px-6 py-3 rounded"

>

Back

</button>

<button

onClick={()=>setStep(step+1)}

className="bg-blue-600 text-white px-6 py-3 rounded"

>

{

step===6

?

"Submit"

:

"Next"

}

</button>

</div>

</div>

)

}