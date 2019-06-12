P.player = (function() {
  'use strict';

  var stage;
  var isFullScreen = false;

  var progressBar = document.querySelector('.progress-bar');
  var player = document.querySelector('.player');

  var controls = document.querySelector('.controls');
  var flag = document.querySelector('.flag');
  var turbo = document.querySelector('.turbo');
  var pause = document.querySelector('.pause');
  var stop = document.querySelector('.stop');
  var fullScreen = document.querySelector('.full-screen');

  var error = document.querySelector('.internal-error');
  var errorBugLink = document.querySelector('#error-bug-link');

  var flagTouchTimeout;
  function flagTouchStart() {
    flagTouchTimeout = setTimeout(function() {
      turboClick();
      flagTouchTimeout = true;
    }, 500);
  }
  function turboClick() {
    stage.runtime.isTurbo = !stage.runtime.isTurbo;
    flag.title = stage.runtime.isTurbo ? 'Turbo mode enabled. Shift+click to disable.' : 'Shift+click to enable turbo mode.';
    turbo.style.display = stage.runtime.isTurbo ? 'block' : 'none';
  }
  function flagClick(e) {
    if (!stage) return;
    if (flagTouchTimeout === true) return;
    if (flagTouchTimeout) {
      clearTimeout(flagTouchTimeout);
    }
    if (e.shiftKey) {
      turboClick();
    } else {
      stage.runtime.start();
      pause.classList.add('pause');
      pause.classList.remove('play');
      stage.runtime.stopAll();
      stage.runtime.triggerGreenFlag();
    }
    stage.focus();
    e.preventDefault();
  }

  function pauseClick(e) {
    if (!stage) return;
    if (stage.runtime.isRunning) {
      stage.runtime.pause();
    } else {
      stage.runtime.start();
    }
    pause.classList.toggle('play', !stage.runtime.isRunning);
    pause.classList.toggle('pause', stage.runtime.isRunning);
    stage.focus();
    e.preventDefault();
  }

  function stopClick(e) {
    if (!stage) return;
    stage.runtime.start();
    pause.classList.add('pause');
    pause.classList.remove('play');
    stage.runtime.stopAll();
    stage.focus();
    e.preventDefault();
  }

  function fullScreenClick(e) {
    if (e) e.preventDefault();
    if (!stage) return;
    document.documentElement.classList.toggle('fs');
    isFullScreen = !isFullScreen;
    if (!e || !e.shiftKey) {
      if (isFullScreen) {
        var el = document.documentElement;
        if (el.requestFullScreenWithKeys) {
          el.requestFullScreenWithKeys();
        } else if (el.webkitRequestFullScreen) {
          el.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (el.requestFullscreen) {
          el.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen();
        }
      }
    }
    if (!isFullScreen) {
      document.body.style.width =
      document.body.style.height =
      document.body.style.marginLeft =
      document.body.style.marginTop = '';
    }
    updateFullScreen();
    if (!stage.isRunning) {
      stage.draw();
    }
    stage.focus();
  }

  function exitFullScreen(e) {
    if (isFullScreen && e.keyCode === 27) {
      fullScreenClick(e);
    }
  }

  function updateFullScreen() {
    if (!stage) return;
    if (isFullScreen) {
      window.scrollTo(0, 0);
      var padding = 8;
      var w = window.innerWidth - padding * 2;
      var h = window.innerHeight - padding - controls.offsetHeight;
      w = Math.min(w, h / .75);
      h = w * .75 + controls.offsetHeight;
      document.body.style.width = w + 'px';
      document.body.style.height = h + 'px';
      document.body.style.marginLeft = (window.innerWidth - w) / 2 + 'px';
      document.body.style.marginTop = (window.innerHeight - h - padding) / 2 + 'px';
      stage.setZoom(w / 480);
    } else {
      stage.setZoom(1);
    }
  }

  function preventDefault(e) {
    e.preventDefault();
  }

  window.addEventListener('resize', updateFullScreen);

  document.addEventListener('fullscreenchange', function () {
    if (isFullScreen !== document.fullscreen) fullScreenClick();
  });
  document.addEventListener('mozfullscreenchange', function () {
    if (isFullScreen !== document.mozFullScreen) fullScreenClick();
  });
  document.addEventListener('webkitfullscreenchange', function () {
    if (isFullScreen !== document.webkitIsFullScreen) fullScreenClick();
  });

  function load(id) {
    progressBar.classList.remove('error');
    showProgress();

    id = +id;

    if (stage) stage.destroy();
    while (player.firstChild) player.removeChild(player.firstChild);
    turbo.style.display = 'none';
    error.style.display = 'none';

    pause.classList.add('pause');
    pause.classList.remove('play');

    P.player.projectId = id;
    P.player.projectURL = id ? 'https://scratch.mit.edu/projects/' + id + '/' : '';

    return new P.IO.JSONRequest(P.config.PROJECT_API.replace('$id', id)).load()
      .then((json) => {
        const type = P.utils.projectType(json);
        if (type === 3) {
          return (new P.sb3.Scratch3Loader(json)).load();
        } else if (type === 2) {
          return P.sb2.loadProject(json);
        } else {
          throw new Error('Unknown project type (only Scratch 2 and 3 projects are supported)');
        }
      })
      .catch((e) => showError(e));
  }

  function start(s, triggerGreenFlag) {
    if (!s) {
      throw new Error('no stage');
    }
    stage = P.player.stage = s;
    player.appendChild(s.root);
    stage.setZoom(stage.zoom);
    stage.focus();
    stage.root.addEventListener('keydown', exitFullScreen);
    stage.runtime.handleError = showError;
    stage.runtime.start();
    hideProgress();
    if (triggerGreenFlag) {
      stage.runtime.triggerGreenFlag();
    }
  }

  function createBugLink(before, after) {
    var url = P.player.projectURL || '(no url)';
    var id = P.player.projectId || '(no id)';
    var title = encodeURIComponent(P.player.projectTitle || P.player.projectURL || 'Project Bug');
    var baseBody = '\n\n\n----\nProject URL: ' + url + '\nProject ID: ' + id + '\n' + location.href + '\n' + navigator.userAgent + '\n';
    return 'https://github.com/forkphorus/forkphorus/issues/new?title=' + title + '&body=' + encodeURIComponent(before + baseBody + after) + '&labels=bug';
  }

  function showError(e) {
    showProgress();
    setProgress(1);
    progressBar.classList.add('error');
    error.style.display = 'block';
    errorBugLink.href = createBugLink('Describe what you were doing to cause this error:', '```\n' + P.utils.stringifyError(e) + '\n```');
    console.error(e);
  }

  // Install our progress hooks
  var totalTasks = 0;
  var finishedTasks = 0;
  P.IO.progressHooks.new = function() {
    totalTasks++;
    setProgress(finishedTasks / totalTasks);
  };
  P.IO.progressHooks.end = function() {
    finishedTasks++;
    setProgress(finishedTasks / totalTasks);
  };
  P.IO.progressHooks.set = function(progress) {
    setProgress(progress);
  };
  P.IO.progressHooks.error = function(error) {
    showError(error);
  };

  function showProgress() {
    if (progressBar.classList.contains('error')) return;
    progressBar.style.display = 'block';
    progressBar.style.opacity = 1;
    setProgress(0);
  }
  function hideProgress() {
    if (progressBar.classList.contains('error')) return;
    progressBar.style.opacity = 0;
  }
  function setProgress(progress) {
    if (progressBar.classList.contains('error')) return;
    progressBar.style.width = (10 + progress * 90) + '%';
  }

  if (P.config.hasTouchEvents) {
    flag.addEventListener('touchstart', flagTouchStart);
    flag.addEventListener('touchend', flagClick);
    pause.addEventListener('touchend', pauseClick);
    stop.addEventListener('touchend', stopClick);
    fullScreen.addEventListener('touchend', fullScreenClick);

    flag.addEventListener('touchstart', preventDefault);
    pause.addEventListener('touchstart', preventDefault);
    stop.addEventListener('touchstart', preventDefault);
    fullScreen.addEventListener('touchstart', preventDefault);

    document.addEventListener('touchmove', function(e) {
      if (isFullScreen) e.preventDefault();
    });
  } else {
    flag.addEventListener('click', flagClick);
    pause.addEventListener('click', pauseClick);
    stop.addEventListener('click', stopClick);
    fullScreen.addEventListener('click', fullScreenClick);
  }

  return {
    load: load,
    start: start,
    createBugLink: createBugLink,
  };
}());
