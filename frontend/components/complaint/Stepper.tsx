interface Props{

currentStep:number;

}

const steps=[

"Upload",

"Complaint",

"Victims",

"Suspects",

"Complainant",

"Review"

];

export default function Stepper({currentStep}:Props){

return(

<div className="flex justify-between">

{

steps.map((step,index)=>(

<div
key={index}
className="flex flex-col items-center flex-1"
>

<div

className={`w-10 h-10 rounded-full flex items-center justify-center

${currentStep>index

?

"bg-blue-600 text-white"

:

"bg-gray-300"

}

`}

>

{index+1}

</div>

<p className="text-sm mt-2">

{step}

</p>

</div>

))

}

</div>

)

}