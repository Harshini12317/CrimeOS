"use client";

import { ComplaintData } from "../types";

interface Props{

form:ComplaintData;

setForm:React.Dispatch<React.SetStateAction<ComplaintData>>;

}

export default function ComplaintDetails({

form,

setForm

}:Props){

function handleChange(

e:React.ChangeEvent<
HTMLInputElement|
HTMLTextAreaElement|
HTMLSelectElement
>

){

setForm({

...form,

[e.target.name]:e.target.value

})

}

return(

<div className="space-y-6">

<div>

<label className="font-medium">

Complaint Type

</label>

<input

name="complaintType"

value={form.complaintType}

onChange={handleChange}

className="w-full border rounded-lg p-3 mt-2"

/>

</div>

<div className="grid grid-cols-2 gap-6">

<div>

<label>

Category

</label>

<select

name="category"

value={form.category}

onChange={handleChange}

className="w-full border rounded-lg p-3 mt-2"

>

<option>Theft</option>

<option>Fraud</option>

<option>Cyber Crime</option>

<option>Accident</option>

<option>Other</option>

</select>

</div>

<div>

<label>

Priority

</label>

<select

name="priority"

value={form.priority}

onChange={handleChange}

className="w-full border rounded-lg p-3 mt-2"

>

<option>Low</option>

<option>Medium</option>

<option>High</option>

<option>Critical</option>

</select>

</div>

</div>

<div className="grid grid-cols-2 gap-6">

<input

type="date"

name="incidentDate"

value={form.incidentDate}

onChange={handleChange}

className="border rounded-lg p-3"

/>

<input

type="time"

name="incidentTime"

value={form.incidentTime}

onChange={handleChange}

className="border rounded-lg p-3"

/>

</div>

<input

placeholder="Incident Location"

name="location"

value={form.location}

onChange={handleChange}

className="w-full border rounded-lg p-3"

/>

<textarea

rows={6}

placeholder="Incident Description"

name="description"

value={form.description}

onChange={handleChange}

className="w-full border rounded-lg p-3"

/>

<textarea

rows={4}

placeholder="AI Summary"

name="aiSummary"

value={form.aiSummary}

onChange={handleChange}

className="w-full border rounded-lg p-3 bg-blue-50"

/>

<textarea

rows={3}

placeholder="Officer Notes"

name="officerNotes"

value={form.officerNotes}

onChange={handleChange}

className="w-full border rounded-lg p-3"

/>

</div>

)

}