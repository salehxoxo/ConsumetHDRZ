var socket = io();
window.isMuted = false;
let flag = true;
let isChatVisible = true; // Keep track of chat visibility
var sound = document.getElementById('message-sound');

const player = document.getElementById("player");
const player2 = document.getElementById("player2");
let videoElement;  // Declare videoElement in a broader scope
let videoElement2; // Declare videoElement2 in a broader scop
const videoSrcInputContainer = document.getElementById("videoSrcInputContainer");
var availableResolutions = {};
let seekInProgress2;
let seekInProgress;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const toggleChat = () => {
    const noti2 = document.getElementById('chat-toggle-btn');
    const chatContainer = document.getElementById('chat-container0');
    const chatInput = document.getElementById('chat-input');  // Input field to focus
    if (flag) {
        chatContainer.style.display = 'none'; // Hide chat
    } else if (!flag) {
        chatContainer.style.display = 'block'; // Show chat
        noti2.style.backgroundColor = '';

        // Focus the input field if chat is shown
        chatInput.focus();
    }
    flag = !flag;
};

// Toggle chat using 'T' key
document.addEventListener('keydown', (event) => {

    if (event.key === '`' || event.key === '`') {
        if (document.fullscreenElement){
            event.preventDefault();
            toggleChat();
        }

    }
});

const toggleFullScreen = async () => {
    const container = document.getElementById('video-chat-container');
    const fullscreenApi = container.requestFullscreen
      || container.webkitRequestFullScreen
      || container.mozRequestFullScreen
      || container.msRequestFullscreen;
      
    if (!document.fullscreenElement) {
      fullscreenApi.call(container);
    } else {
      document.exitFullscreen();
    }
};

const togglePlayback = (evt) => {
    const btn = document.getElementById('play-btn-icon');
    const video = document.getElementById('videoPlayer');
  
    
    if (video.paused) {
      video.play();
      btn.classList.remove('bi-play');
      btn.classList.add('bi-pause');
    } else {
      video.pause();
      btn.classList.add('bi-play');
      btn.classList.remove('bi-pause');
    }
};

const forcePause = (evt) => {
    console.log('forcepause');
    const btn = document.getElementById('play-btn-icon');
    const video = document.getElementById('videoPlayer');
    video.pause();
    btn.classList.add('bi-play');
    btn.classList.remove('bi-pause');
};

const forcePlay = (evt) => {
    console.log('forceplay');
    const btn = document.getElementById('play-btn-icon');
    const video = document.getElementById('videoPlayer');
    video.play();
    btn.classList.remove('bi-play');
    btn.classList.add('bi-pause');
};

const toggleMute = (evt) => {
    const volumeSlider = document.getElementById('volume-slider');
  
  
    // Toggle volume slider visibility
    volumeSlider.style.display = (volumeSlider.style.display === 'none') ? 'block' : 'none';
};

// Function to seek forward by 10 seconds
const seekForward = () => {
    const video = document.getElementById('videoPlayer');
    video.currentTime = Math.min(video.duration, video.currentTime + 5); // Seek forward 10 seconds
};
  
  // Function to seek backward by 10 seconds
  const seekBackward = () => {
    const video = document.getElementById('videoPlayer');
    video.currentTime = Math.max(0, video.currentTime - 5); // Seek backward 10 seconds
};

// Function to format time in MM:SS format
const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
};
let lastUpdate = 0;
const updateSeekBar = () => {
    const now = Date.now();
    if (now - lastUpdate < 100) return; // Only update every 100ms
    lastUpdate = now;

    const video = document.getElementById('videoPlayer');
    const seekBar = document.getElementById('seek-bar');
    const currentTimestamp = document.getElementById('current-timestamp');

    if (!video || !seekBar || !currentTimestamp) return;

    seekBar.max = video.duration;
    seekBar.value = video.currentTime;
    currentTimestamp.textContent = formatTime(video.currentTime);
};


// const updateSeekBar = () => {
//     // console.log("HELLo")
//     const video = document.getElementById('videoPlayer');
//     const seekBar = document.getElementById('seek-bar');
//     const currentTimestamp = document.getElementById('current-timestamp');
    
//     seekBar.max = video.duration;
//     seekBar.value = video.currentTime;
  
//     // Update the current timestamp display
//     currentTimestamp.textContent = formatTime(video.currentTime);
// };
  
const seekVideo = () => {
    const video = document.getElementById('videoPlayer');
    const seekBar = document.getElementById('seek-bar');
    
    video.currentTime = seekBar.value;
};



document.addEventListener('DOMContentLoaded', function() {


        // Listen for messages from the server
    socket.on('message', function(data) {
        const input = document.getElementById('chat-input');
        const chat = document.getElementById('chat');
        // chat.innerHTML = `<strong>${data.user}:</strong> ${data.message}`;
        chat.innerHTML += `<div><b>${data.user}:</b> ${data.message}</div>`;
        // chatMessages.appendChild(messageElement);
        const noti = document.getElementById('chat-toggle-btn');
        const chatContainer = document.getElementById('chat-container0');
        if (window.getComputedStyle(chatContainer).display === 'none') {
            noti.style.backgroundColor = 'red';
        }
        sound.play();
        chat.scrollTop = chat.scrollHeight;
    });

        // Send message to the server when the "Send" button is clicked
    document.getElementById('submit-chat').addEventListener('click', sendMessagee);

    // Send message to the server when "Enter" key is pressed in the chat input field
    document.getElementById('chat-input').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent the default form submission
            sendMessagee();
        }
    });

    // Define a reusable function for sending the message
    function sendMessagee() {
        const input = document.getElementById('chat-input');
        const message = input.value;
        const room_code = document.getElementById('room_code').value;

        if (message.trim()) { // Check if the message is not just whitespace
            socket.emit('send_message', { room: room_code, message: message });
            input.value = '';  // Clear the input field
        }
        // const chat = document.getElementById('chat');
        // chat.scrollTop = chat.scrollHeight;
    }



    // Get the form by its ID (make sure the form in join.html has this ID)
    const form = document.getElementById('join-room-form');

    if (form) {  // Check if the form exists on the current page
        form.addEventListener('submit', function(event) {
            event.preventDefault();  // Prevent the form from submitting immediately

            const roomCode = document.getElementById('query').value;  // Get the room code

            // Emit the 'join_room_event' via Socket.IO
            // socket.emit('join_room_event', { room: roomCode });

            // After emitting the event, submit the form to proceed with the redirect
            form.submit();
        });
    }


    // Check if we are on the index page
    if (document.getElementById('index-page')) {


        if (!sessionStorage.getItem('roomCreated')) {
            // Emit the create_room event when the page is loaded
            socket.emit('create_room');
            // Mark the room as created in sessionStorage
            sessionStorage.setItem('roomCreated', 'true');
        }
    }



    if (document.getElementById('Room')) {

        let isMovie = document.getElementById('isMovie').value;

          // Check if isMovie is equal to 1
        if (parseInt(isMovie) === 1) {
            document.getElementById('contentt').style.display = 'block';
            document.getElementById('anime_content').style.display = 'none';
        }else if (parseInt(isMovie) === 0){
            document.getElementById('anime_content').style.display = 'block';
            document.getElementById('contentt').style.display = 'none';
        }

        seekInProgress = false;  // Flag to track if a seek operation is happening
        let pausePlayTimeout = null;



        videoElement = document.getElementById('videoPlayer');

        // Toggle full-screen mode
        document.getElementById('fullscreen-toggle-btn').addEventListener('click', toggleFullScreen);
        // const playBtn = document.getElementById('play-btn'); 
        // document.getElementById('play-btn').addEventListener('click', togglePlayback);
        // document.getElementById('videoPlayer').addEventListener('click', togglePlayback);
        document.getElementById('mute-btn').addEventListener('click', toggleMute);
        const volumeSlider = document.getElementById('volume-slider');
        const seekBar = document.getElementById('seek-bar');
          // Add event listeners for forward and backward buttons
        // document.getElementById('forward-btn').addEventListener('click', seekForward);
        // document.getElementById('backward-btn').addEventListener('click', seekBackward);

        document.getElementById('chat-toggle-btn').addEventListener('click', () => {
            toggleChat();
        });

                // Update the seek bar as the video plays
        videoElement.addEventListener('timeupdate', updateSeekBar);

        // Seek the video when the user interacts with the seek bar
        seekBar.addEventListener('input', seekVideo);


          // Update the volume based on slider input
        volumeSlider.addEventListener('input', (e) => {
            videoElement.volume = e.target.value;
            videoElement.muted = false; // Ensure the video is unmuted when adjusting volume
        });
        // console.log("Video1 inside Room: ", videoElement);
        let room_code6 = document.getElementById('room_code').value;
        socket.emit('join_room_event', { room: room_code6 });
        const videoSrcInput = document.getElementById("videoSrcInput").value;
        // const videoElement = document.getElementById('videoPlayer');
        if (videoSrcInput !== '') {
            videoSrc = videoSrcInput;
            // loadVideo(videoSrc);
            loadVideo(videoSrc, videoElement);
            videoElement.pause();
        }

        // Emit play/pause event on video click
        videoElement.addEventListener('click', () => {
            socket.emit('play_pause_stop', { action: 'playpause', room_code: room_code6 });
        });


        // player.style.display = 'block';
        // socket.emit('sync_room_event');

        // Sync functionality every 5 seconds
        setInterval(function() {
            // if (!seekInProgress && !seekInProgress2) {  // Only sync if seeking is not in progress
                socket.emit('sync_request', {
                    room_code: room_code6,
                    currentTime: videoElement.currentTime,
                    isPlaying: !videoElement.paused
                });
            // }
        }, 6000);



        // videoElement.addEventListener('play', function() {
        //     if (!seekInProgress) {
        //         socket.emit('play_pause_stop', { action: 'play', room_code: room_code6 });
        //     }
        // });

        // Listen for pause event
        // videoElement.addEventListener('pause', function() {
        //     if (!seekInProgress) {
        //         socket.emit('play_pause_stop', { action: 'pause', room_code: room_code6 });
        //     }
        // });

        // Listen for stop event (video ended)
        // videoElement.addEventListener('ended', function() {
        //     socket.emit('play_pause_stop', { action: 'stop', room_code: room_code6 });
        //     videoElement.currentTime = 0;  // Reset the time to 0 when video ends
        // });

        // Listen for seeking event (when user is changing the video time)
        // videoElement.addEventListener('seeking', function() {
        //     seekInProgress = true;  // Set flag to true during seeking
        //     clearTimeout(pausePlayTimeout);  // Clear any pending timeouts
        //     socket.emit('seek_event', {
        //         room_code: room_code6,
        //         currentTime: videoElement.currentTime
        //     });
        // });

        // Listen for seeked event (when user has finished seeking)
        // videoElement.addEventListener('seeked', function() {
        //     socket.emit('seek_event', {
        //         room_code: room_code6,
        //         currentTime: videoElement.currentTime
        //     });

        //     // Add a small delay to avoid rapid play/pause events after seeking
        //     pausePlayTimeout = setTimeout(function() {
        //         seekInProgress = false;  // Allow play/pause events after the delay
        //     }, 500);  // 500 ms delay after seeking
        // });



    

    }

    if (document.getElementById('Room2')) {

        seekInProgress2 = false;  // Flag to track if a seek operation is happening
        let pausePlayTimeout2 = null;


        let room_code2 = document.getElementById('room_code').value;
        socket.emit('join_room_event', { room: room_code2 });

        videoElement2 = document.getElementById('videoPlayer');
        const videoSrcInput2 = document.getElementById("videoSrcInput2").value;
        if (videoSrcInput2 !== '') {
            videoSrc2 = videoSrcInput2;
            console.log(videoSrc2)
            // loadVideo(videoSrc);
            loadVideo(videoSrc2, videoElement2);
            videoElement2.pause();
        }

        
        socket.on('video_src_set', function(data) {

            location.reload();

            // const videoElement3 = document.getElementById('videoPlayer');
            // let room_code = document.getElementById('room_code').value;

            // var availableResolutionsStr = document.getElementById("res").value;
            // const availableResolutions = JSON.parse(availableResolutionsStr);
            // function populateResolutionList() {
            //     const resolutionList = document.getElementById('resolutionList');
            //     resolutionList.innerHTML = ''; // Clear the current list
        
            //     // Add each resolution to the list
            //     availableResolutions.forEach(source => {
            //         const listItem = document.createElement('li');
            //         listItem.innerHTML = `<a class="dropdown-item" href="#" onclick="changeResolution('${source}')">${source}</a>`;
            //         resolutionList.appendChild(listItem);
            //     });
            // }

            // console.log('fu k2', data, room_code);
            // if ((data.videoSrc) && (data.room_code == room_code)) {  
            //     loadVideo(data.videoSrc, videoElement3);
            // }
            // loadVideo(data.videoSrc, videoElement3);
            // videoElement3.pause();
        });
        // player2.style.display = 'block';

        document.getElementById('fullscreen-toggle-btn').addEventListener('click', toggleFullScreen);
        document.getElementById('mute-btn').addEventListener('click', toggleMute);
        const volumeSlider = document.getElementById('volume-slider');
        document.getElementById('chat-toggle-btn').addEventListener('click', () => {
            toggleChat();
        });
        
        videoElement2.addEventListener('timeupdate', updateSeekBar);

                // Update the seek bar as the video plays
        // videoElement.addEventListener('timeupdate', updateSeekBar);

        // Seek the video when the user interacts with the seek bar
        // seekBar.addEventListener('input', seekVideo);


          // Update the volume based on slider input
        volumeSlider.addEventListener('input', (e) => {
            videoElement2.volume = e.target.value;
            videoElement2.muted = false; // Ensure the video is unmuted when adjusting volume
        });


        socket.on('sync_update', async function(data) {
            var timeDiff = Math.abs(videoElement2.currentTime - data.currentTime);
            if (timeDiff > 0.5) {  // If more than 1 second out of sync
                // socket.emit('sync_screen', {action: 'Display', room_code: room_code2});
                // socket.emit('play_pause_stop', { action: 'pause', room_code: room_code2 });
                videoElement2.currentTime = data.currentTime + 0.5;
                // console.log('Please wait 3 seconds');
                // await sleep(4600); // Wait for 2 seconds
                // socket.emit('sync_screen', {action: 'NoDisplay', room_code: room_code2});
                // socket.emit('play_pause_stop', { action: 'play', room_code: room_code2 });

                // videoElement2.pause();
                if (data.isPlaying) {
                    videoElement2.play();
                } else {
                    videoElement2.pause();
                }
            }
        });

        // Emit play/pause event on video click
        videoElement2.addEventListener('click', () => {
            socket.emit('play_pause_stop', { action: 'playpause', room_code: room_code2 });
        });

        // videoElement2.addEventListener('play', function() {
        //     if (!seekInProgress2) {
        //         socket.emit('play_pause_stop', { action: 'play', room_code: room_code2 });
        //     }
        // });

        // // Listen for pause event
        // videoElement2.addEventListener('pause', function() {
        //     if (!seekInProgress2) {
        //         socket.emit('play_pause_stop', { action: 'pause', room_code: room_code2 });
        //     }
        // });

        // // Listen for stop event (video ended)
        // videoElement2.addEventListener('ended', function() {
        //     socket.emit('play_pause_stop', { action: 'stop', room_code: room_code2 });
        //     videoElement2.currentTime = 0;  // Reset the time to 0 when video ends
        // });


        // videoElement2.addEventListener('seeking', function() {
        //     seekInProgress2 = true;  // Set flag to true during seeking
        //     clearTimeout(pausePlayTimeout2);  // Clear any pending timeouts
        //     // socket.emit('seek_event', {
        //     //     room_code: room_code6,
        //     //     currentTime: videoElement.currentTime
        //     // });
        // });

        // Listen for seeked event (when user has finished seeking)
        // videoElement2.addEventListener('seeked', function() {
        //     // socket.emit('seek_event', {
        //     //     room_code: room_code6,
        //     //     currentTime: videoElement.currentTime
        //     // });

        //     // Add a small delay to avoid rapid play/pause events after seeking
        //     pausePlayTimeout2 = setTimeout(function() {
        //         seekInProgress2 = false;  // Allow play/pause events after the delay
        //     }, 500);  // 500 ms delay after seeking
        // });


        // socket.on('seek_update', function(data) {
        //     // Update the video player's current time when a seek event is received
        //     if (Math.abs(videoElement2.currentTime - data.currentTime) > 0.5) {  // Allow a small tolerance
        //         videoElement2.currentTime = data.currentTime;
        //     }
        // });

        

    }


    let room_code3 = document.getElementById('room_code').value;
    let userr = document.getElementById('user').value;
    // const seekBar = document.getElementById('seek-bar');
    document.getElementById('play-btn').onclick = function() {
        socket.emit('play_pause_stop', { action: 'playpause', user: userr, room_code: room_code3 });
    };
    document.getElementById('forward-btn').onclick = function() {
        socket.emit('play_pause_stop', { action: 'forward', user: userr, room_code: room_code3 });
    };
    document.getElementById('backward-btn').onclick = function() {
        socket.emit('play_pause_stop', { action: 'backward', user: userr, room_code: room_code3 });
    };

    // document.getElementById('backward-btn').onclick = function() {
    //     seekBar.addEventListener('input', seekVideo);
    //     socket.emit('play_pause_stop', { action: 'backward', room_code: room_code3 });
    // };


    // document.getElementById('pauseButton').onclick = function() {
    //     socket.emit('play_pause_stop', { action: 'pause', room_code: room_code3 });
    // };

    // document.getElementById('stopButton').onclick = function() {
    //     socket.emit('play_pause_stop', { action: 'stop', room_code: room_code3 });
    // };

});



socket.on('play_pause_stop', function(data) {

    if (data.action === 'playpause') {
        togglePlayback(); 
    }
    if (data.action === 'pause') {
        forcePause(); 
    }
    if (data.action === 'play') {
        forcePlay(); 
    }
    if (data.action === 'fs') {
        toggleFullScreen();
    }
    if (data.action === 'forward') {
        seekForward();
    }
    if (data.action === 'backward') {
        seekBackward();
    }

    const message = data.message;
    const logsContainer = document.getElementById('logs');
    const logMessage = document.createElement('div');
    logMessage.textContent = message;
    logsContainer.appendChild(logMessage);
    logsContainer.scrollTop = logsContainer.scrollHeight;
});

socket.on('syncc_screen', function(data){
    const syncDisplay = document.getElementById("sync-overlay");
    if (data.action === 'Display') {
        syncDisplay.style.display = "flex";
    } else if (data.action === 'NoDisplay') {
        syncDisplay.style.display = "none";
    }
});



function loadVideo(src, videoElement) {
    // Update the URL to include the src parameter
    const urlWithSrc = `https://m3u8-proxy-cors-kappa-red.vercel.app/cors?url=${encodeURIComponent(src)}&headers={"referer": "https://s3embtaku.pro"}`;

    if (Hls.isSupported()) {
        var hls = new Hls();
        hls.loadSource(urlWithSrc);
        hls.attachMedia(videoElement);
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = urlWithSrc;
    }
}

