let player;

function extractVideoID(url) {
    const regExp = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '0',
        width: '0',
        videoId: '',
        playerVars: {
            autoplay: 0,
            controls: 0
        }
    });
}

function loadVideo() {
    const url = document.getElementById("youtubeUrl").value;
    const videoId = extractVideoID(url);

    if(videoId){
        player.loadVideoById(videoId);
    } else {
        alert("Invalid URL");
    }
}

function playVideo() {
    player.playVideo();
}

function pauseVideo() {
    player.pauseVideo();
}