import { Trash2 } from "lucide-react";

import { UploadedFile } from "../types";

interface Props{

file:UploadedFile;

removeFile:(id:number)=>void;

}

export default function UploadedFileCard({

file,

removeFile

}:Props){

return(

<div className="border rounded-lg p-4 flex justify-between">

<div>

<p className="font-semibold">

{file.file.name}

</p>

<p className="text-gray-500 text-sm">

{file.type}

</p>

</div>

<button

onClick={()=>removeFile(file.id)}

>

<Trash2/>

</button>

</div>

)

}