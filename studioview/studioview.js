(function(scope) {
  'use strict';

  function getURL(url, type, callback) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = type;
    xhr.onload = function() {
      callback(xhr.response);
    };
    xhr.open('GET', url);
    xhr.send();
  };

  var StudioView = function(studioId) {
    this.studioId = studioId;
    this.page = 1;
    this.loadingPage = false;
    this.projects = 0;

    this.root = document.createElement('div');
    this.root.className = 'studioview-root';
    this.projectList = document.createElement('div');
    this.projectList.className = 'studioview-list';
    this.projectList.addEventListener('scroll', this.handleScroll.bind(this), {passive: true});
    this.root.appendChild(this.projectList);
  };

  StudioView.prototype.addProject = function(id, title, author, thumbnail) {
    var el = this.createProjectElement(id, title, author, thumbnail);
    el.style.transform = 'translateX(' + (148 * this.projects) + 'px)';
    this.projects++;
    this.projectList.appendChild(el);
  };

  StudioView.prototype.createProjectElement = function(id, title, author, thumbnail) {
    var el = document.createElement('div');
    el.className = 'studioview-project';
    el.dataset.id = id;

    var thumbnailEl = document.createElement('div');
    var thumbnailImg = document.createElement('img');
    thumbnailImg.src = thumbnail;
    thumbnailImg.width = 144;
    thumbnailImg.height = 108;
    thumbnailEl.appendChild(thumbnailImg);
    thumbnailEl.className = 'studioview-thumb';
    el.appendChild(thumbnailEl);

    var titleEl = document.createElement('div');
    titleEl.innerText = title;
    titleEl.className = 'studioview-title';
    el.appendChild(titleEl);

    var authorEl = document.createElement('div');
    authorEl.innerText = 'by ' + author;
    authorEl.className = 'studioview-author';
    el.appendChild(authorEl);

    el.addEventListener('click', this.handleClick.bind(this), true);

    return el;
  }

  StudioView.prototype.addTombstone = function() {
    var el = document.createElement('div');
    el.className = 'studioview-project';
    el.className = 'studioview-tombstone';

    this.projectList.appendChild(el);
  }

  StudioView.prototype.handleClick = function(e) {
    var project = e.target.closest('.studioview-project');
    var id = project.dataset.id;
    this.onselect(id);
  };

  StudioView.prototype.handleScroll = function(e) {
    var scroll = this.projectList.scrollLeft;
  };

  StudioView.prototype.loadNextPage = function() {
    if (this.loadingPage) {
      throw new Error('Already loading the next page!');
    }

    this.loadingPage = true;
    var url = StudioView.STUDIO_API
      .replace('$id', this.studioId)
      .replace('$page', this.page);

    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      var doc = xhr.response;
      var projects = doc.querySelectorAll('.project');
      for (var i = 0; i < projects.length; i++) {
        var project = projects[i];
        var id = project.getAttribute('data-id');
        var title = project.querySelector('.title').innerText.trim();
        var author = project.querySelector('.owner a').innerText.trim();
        var thumbnail = project.querySelector('img').getAttribute('data-original');
        this.addProject(id, title, author, thumbnail);
      }
      this.updateContents();
      this.page++;
      this.loadingPage = false;
    }.bind(this);
    xhr.responseType = 'document';
    xhr.open('GET', url);
    xhr.send();
  };

  StudioView.prototype.onselect = function(id) {
    console.log('[studioview] Selected project', id);
  };

  StudioView.STUDIO_API = 'https://scratch.garbomuffin.com/api/site-api/projects/in/$id/$page/';

  scope.StudioView = StudioView;
}(window));
