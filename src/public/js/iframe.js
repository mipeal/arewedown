(function(){
    var clientRefreshInterval = document.querySelector('body').getAttribute('data-clientRefreshInterval'),
        activeFrame = document.querySelector('.contentFrame1'),
        inactiveFrame = document.querySelector('.contentFrame2');

    if (clientRefreshInterval)
        clientRefreshInterval = parseInt(clientRefreshInterval);
    
    function update(){
        inactiveFrame.contentWindow.location = '/status'
        inactiveFrame.onload = function(){
            setTimeout(function(){
                inactiveFrame.classList.add('iframe--show');
                activeFrame.classList.remove('iframe--show');
                inactiveFrame = activeFrame;
                activeFrame = document.querySelector('.iframe--show');
            }, 500);
        }
    }

    if (clientRefreshInterval){
        setInterval(update, clientRefreshInterval);
    }

    update();
})()
