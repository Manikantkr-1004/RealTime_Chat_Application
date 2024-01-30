
export function Recently({roomHistory,setName,setRoom,handleJoin}) {
    
    const handleMakeJoin = (boxroom,boxname)=>{
        setName(boxname);
        setRoom(boxroom);
        handleJoin();
    }

    return (
        <div className="recently">
            <h5>Recently Joined Room</h5>
            <span style={{fontWeight:'500',color:'#b10000'}}>Click on Anyone Box👇 to Join with Same Room no and Name.</span>
            <div className="recently-parent">
                {
                    roomHistory?.map((ele,ind)=>(
                        <div onClick={()=>handleMakeJoin(ele.room,ele.name)}>
                            <p>Room: {ele.room} with Name: {ele.name}</p>
                        </div>
                    ))
                }
            </div>

            <p>To Delete Joined Room no. and Name History, You have to close the open tab or browser.</p>
        </div>
    )
}
