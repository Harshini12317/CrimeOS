export interface UploadedFile{
    id:number;
    file:File;
    type:string;
}

export interface ComplaintData{

    complaintType:string;

    category:string;

    priority:string;

    incidentDate:string;

    incidentTime:string;

    location:string;

    description:string;

    aiSummary:string;

    officerNotes:string;

}