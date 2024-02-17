import React, { useEffect, useRef, useState } from 'react'
import EmojiPicker from 'emoji-picker-react';
import { io } from "socket.io-client";
import '../src/App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faClock, faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons';
import 'animate.css';
import notify from "../src/assets/notify.mp3"
import sent from "../src/assets/sent.mp3";
import { Recently } from './Recently';

const socket = io.connect("https://chat-app-03hi.onrender.com");
// const socket = io.connect("http://localhost:5000");

function App() {

  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [chat, setChat] = useState(false);
  const [emojiEnable, setEmojiEnable] = useState(false);
  const [message, setMessage] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);
  const audioRef = useRef([]);
  const [roomHistory, setRoomHistory] = useState(JSON.parse(sessionStorage.getItem('room_data')) || []);
  const [userMessage, setUserMessage] = useState('');

  const handleJoin = async (e) => {
    e?.preventDefault();
    setLoading(true);

    if (name.trim() !== '' && room) {
      let time = new Date().toLocaleTimeString('en-US');

      await socket.emit('join_room', { name, room, time, position: 'center', userMessage: `${name} joined this room` });
      setLoading(false);
      setMessage(prev => [...prev, { name, room, time, position: 'center', userMessage: `You joined this room` }]);

      let finding = roomHistory.find((ele) => ele.room === room);
      if (finding) {
        let updateRoomHistory = roomHistory.map((ele) => ele.room === room ? { ...ele, name: name } : ele);
        setRoomHistory(updateRoomHistory)
      } else {
        let newRoomHistory = { name, room };
        setRoomHistory((prev) => [...prev, newRoomHistory]);
      }

      setChat(true);
      audioRef.current[0].play();
    }
  }

  useEffect(() => {
    socket.on('newperson', (data) => {
      setMessage(prev => [...prev, data]);
    });

    socket.on('receive_message', (data) => {
      setMessage(prev => [...prev, { ...data, position: 'right' }]);
    });

    socket.on('left_room', (data) => {
      let time = new Date().toLocaleTimeString('en-US');
      setMessage(prev => [...prev, { ...data, time, position: 'center', userMessage: `${data.name} left this room` }]);
    });

    return () => {
      socket.off('newperson');
      socket.off('receive_message');
      socket.off('left_room');
    }
  }, [socket]);


  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
    if (message.length > 0 && message[message.length - 1].name !== name) {
      audioRef.current[0].play();
    }

  }, [message]);

  useEffect(() => {
    if (roomHistory.length > 0) {
      sessionStorage.setItem('room_data', JSON.stringify(roomHistory));
    }
  }, [roomHistory])


  const handleSendMessage = async () => {
    setEmojiEnable(false);
    if (userMessage.trim() !== '') {
      let time = new Date().toLocaleTimeString('en-US');
      await socket.emit('send_message', { name, room, time, position: 'left', userMessage })
      setMessage(prev => [...prev, { name, room, time, position: 'left', userMessage }]);
      audioRef.current[1].play();
      setUserMessage("")
    }
  }

  const handleSendButton = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  }

  const handleEmoji = (emoji) => {
    setUserMessage((prev) => prev + emoji.emoji);
  }

  const handleMessage = (mess) => {
    const urlRegex = /((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z0-9()]{2,}(?:\/[^\s]*)?)/g;
    const boldRegex = /\*(.*?)\*/g;
  
    const parts = mess.split(urlRegex);
  
    const elements = parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a key={index} href={part} target="_blank">
            {part}
          </a>
        );
      } else {
        part = part.replace(boldRegex, '<b>$1</b>');
        return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
      }
    });
  
    return elements;
  };
  

  const checkMess = (mess)=>{
    let checking = mess.trim().split(" ");
    if(checking.length===2 && checking[0]==='img'){
      return true;
    }else{
      return false;
    }
  }

  return (
    <div>
      <audio ref={(e) => (audioRef.current[0] = e)} hidden src={notify}></audio>
      <audio ref={(e) => (audioRef.current[1] = e)} hidden src={sent}></audio>
      {!chat && <form className='animate__animated animate__fadeInUp' onSubmit={handleJoin}>
        <h1>Welcome To Private Talk</h1>
        <img src='https://i.gifer.com/origin/98/98447b873b927d46f752e9e0fc9c2910_w200.gif' alt='chat' />
        <input value={name} onChange={(e) => setName(e.target.value)} type='text' name='name' autoComplete='true' placeholder='Enter Your Name' required /><br /><br />
        <input value={room} onChange={(e) => setRoom(+e.target.value)} type='number' name='room' placeholder='Enter Room No.' required /><br /><br />
        <button type='submit' name='submit'>{loading ? <FontAwesomeIcon size='lg' spin icon={faSpinner} /> : "Join Room"}</button>
        <br />
        <p>Keep remember, Always enter unique and 4-10 digit as room no. for privacy & security.</p>
        <p>To Chat with Another, Tell that Person to Join with Same Room No in Which Room No. You Joined or want to Join.</p>
        {roomHistory.length > 0 && <Recently roomHistory={roomHistory} setName={setName} setRoom={setRoom} handleJoin={handleJoin} />}
      </form>}
      {chat && <div className='animate__animated animate__fadeIn' id='chat-container'>
        <div ref={chatRef} className='chat'>
          {
            message?.map((ele, ind) => (
              <div key={ind} className={ele.position === 'center' ? 'animate__animated animate__fadeInUp chat-center' : ele.position === 'left' ? 'chat-left' : 'chat-right'}>
                {!checkMess(ele.userMessage) && <div>{handleMessage(ele.userMessage)}</div>}
                {checkMess(ele.userMessage) && <div><img style={{width:'100%', borderRadius:"2px 9px 9px 9px"}} src={ele.userMessage.split(' ')[1]} alt='wrong url' /></div>}
                {ele.position === 'center' && ele.time !== null && <div><FontAwesomeIcon size='sm' icon={faClock} /> {ele.time}</div>}
                {ele.position !== 'center' && <div><FontAwesomeIcon size='sm' icon={faCheckCircle} /> {ele.name === name ? 'You' : ele.name} {ele.time}</div>}
              </div>
            ))
          }
        </div>
        <div className='sending'>
          <div className='inputarea'>
            <div onClick={() => setEmojiEnable(!emojiEnable)}>🙂</div>
            <textarea onKeyDown={(e) => handleSendButton(e)} value={userMessage} onChange={(e) => setUserMessage(e.target.value)} type='text' placeholder='Type Your Message...' ></textarea>
          </div>
          <button onClick={handleSendMessage}><FontAwesomeIcon size='lg' icon={faPaperPlane} /></button>
        </div>
      </div>}

      {emojiEnable && <div className='emoji'>
        <EmojiPicker onEmojiClick={(e) => handleEmoji(e)} width='100%' height='100%' />
      </div>}
    </div>
  )
}

export default App;
