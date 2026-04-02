import { useState, useEffect } from "react";
import axios from "axios";

function CreateTask() {

const [title,setTitle] = useState("");
const [description,setDescription] = useState("");
const [deadline,setDeadline] = useState("");
const [assignedTo,setAssignedTo] = useState("");
const [team,setTeam] = useState("");
const [teams,setTeams] = useState([]);

useEffect(()=>{

axios.get("/api/team/my-teams",{
headers:{
Authorization:`Bearer ${localStorage.getItem("token")}`
}
}).then(res=>{
setTeams(res.data);
})

},[])


const createTask = async ()=>{

await axios.post("/api/task/create",{

title,
description,
assignedTo,
team,
deadline

},{
headers:{
Authorization:`Bearer ${localStorage.getItem("token")}`
}
})

alert("Task created")

}


return (

<div>

<h2>Create Task</h2>

<input
placeholder="Title"
onChange={(e)=>setTitle(e.target.value)}
/>

<textarea
placeholder="Description"
onChange={(e)=>setDescription(e.target.value)}
/>

<input
type="date"
onChange={(e)=>setDeadline(e.target.value)}
/>

<select onChange={(e)=>setTeam(e.target.value)}>

<option>Select Team</option>

{teams.map(team=>(
<option key={team._id} value={team._id}>
{team.name}
</option>
))}

</select>

<button onClick={createTask}>
Create Task
</button>

</div>

)

}

export default CreateTask;