import { useEffect,useState } from "react"
import axios from "axios"

function TaskList(){

const [tasks,setTasks] = useState([])

useEffect(()=>{

axios.get("/api/task/all",{
headers:{
Authorization:`Bearer ${localStorage.getItem("token")}`
}
}).then(res=>{
setTasks(res.data)
})

},[])


return(

<div>

{tasks.map(task=>(

<div
key={task._id}
style={{
backgroundColor: task.status === "failed" ? "red" : "white",
padding:"15px",
margin:"10px"
}}
>

<h3>{task.title}</h3>

<p>{task.description}</p>

<p>Assigned By: {task.assignedBy?.name}</p>

<p>Team: {task.team?.name}</p>

<p>Status: {task.status}</p>

<p>Progress: {task.percentage}%</p>

</div>

))}

</div>

)

}

export default TaskList