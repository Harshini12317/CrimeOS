"use client";

import { Sparkles } from "lucide-react";

export default function ExtractButton(){

function handleExtract(){

alert("Calling AI Backend...");

}

return(

<div className="mt-8 flex justify-end">

<button

onClick={handleExtract}

className="bg-indigo-600 text-white px-6 py-3 rounded-lg flex gap-2"

>

<Sparkles/>

Extract From Documents

</button>

</div>

)

}