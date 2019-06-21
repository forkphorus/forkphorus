(function(scope) {
  'use strict';

  /**
   * Determines if an element is visible, accounting for parents and their bounding rects.
   */
  function isElementVisible(el) {
    // see https://stackoverflow.com/a/21627295
    var rect = el.getBoundingClientRect();
    var top = rect.top;
    var height = rect.height;
    var el = el.parentNode;

    if (rect.bottom < 0) return false
    if (top > document.documentElement.clientHeight) return false
    do {
      rect = el.getBoundingClientRect()
      if (top <= rect.bottom === false) return false
      if ((top + height) <= rect.top) return false
      el = el.parentNode
    } while (el != document.body)
    return true
  }

  var StudioView = function(studioId) {
    this.studioId = studioId;
    this.page = 1;
    this.ended = false;
    this.loadingPage = false;
    this.projects = 0;

    this.root = document.createElement('div');
    this.root.className = 'studioview-root';
    this.projectList = document.createElement('div');
    this.projectList.className = 'studioview-list';
    this.projectList.addEventListener('scroll', this.handleScroll.bind(this), {passive: true});
    this.root.appendChild(this.projectList);
    this.setTheme('light');

    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(this.handleIntersection.bind(this), {
        root: this.projectList,
      });
    } else {
      this.intersectionObserver = null;
    }
  };

  /**
   * Add a project to the view.
   */
  StudioView.prototype.addProject = function(id, title, author, thumbnail) {
    var el = this.createProjectElement(id, title, author, thumbnail);
    this.projects++;
    this.projectList.appendChild(el);
  };

  /**
   * Create the HTML element for a project.
   */
  StudioView.prototype.createProjectElement = function(id, title, author, thumbnail) {
    var el = document.createElement('div');
    el.className = 'studioview-project';
    el.dataset.id = id;

    var thumbnailEl = document.createElement('div');
    var thumbnailImg = this.createLazyImage(thumbnail, 144, 108);
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
  };

  StudioView.prototype.createLazyImage = function(src, width, height) {
    var el = document.createElement('img');
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(el);
      el.className = 'studioview-lazy';
      el.dataset.src = src;
    } else {
      // then we just won't lazy load it
      el.src = src;
    }
    el.width = width;
    el.height = height;
    return el;
  }

  StudioView.prototype.addErrorElement = function() {
    var el = document.createElement('div');
    el.innerText = 'There was an error loading the next page of projects.';
    el.className = 'studioview-error';
    this.projectList.appendChild(el);
  };

  StudioView.prototype.handleScroll = function(e) {
    if (this.canLoadNext() && isElementVisible(this.projectList.lastChild)) {
      this.loadNextPage();
    }
  };

  StudioView.prototype.handleClick = function(e) {
    var project = e.target.closest('.studioview-project');
    var id = project.dataset.id;
    this.onselect(id);
  };

  StudioView.prototype.handleIntersection = function(entries, observer) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var target = entry.target;
        target.src = target.dataset.src;
        target.dataset.src = '';
        target.className = '';
        observer.unobserve(target);
      }
    });
  };

  /**
   * Determines whether it is safe to attempt to load the next page.
   */
  StudioView.prototype.canLoadNext = function() {
    return !this.loadingPage && !this.ended;
  };

  /**
   * Begins loading the next page.
   */
  StudioView.prototype.loadNextPage = function() {
    if (this.loadingPage) {
      throw new Error('Already loading the next page');
    }
    if (this.ended) {
      throw new Error('There are no more pages to load');
    }

    this.root.setAttribute('loading', '');
    this.loadingPage = true;
    var url = StudioView.STUDIO_API
      .replace('$id', this.studioId)
      .replace('$page', this.page);

    var xhr = new XMLHttpRequest();

    xhr.onload = function() {
      var doc = xhr.response;
      var projects = doc.querySelectorAll('.project');
      /*
      Each project should be:
      <li class="project thumb item" data-id="12345">
        <a href="/projects/12345/">
          <img class="lazy image" data-original="//cdn2.scratch.mit.edu/get_image/project/12345_144x108.png" width="144" height="108" />
        </a>
        <span class="title">
          <a href="/projects/12345/">Title</a>
        </span>
        <span class="owner" >
          by <a href="/users/Author/">Author</a>
        </span>
      </li>
      */
      for (var i = 0; i < projects.length; i++) {
        var project = projects[i];
        var id = project.getAttribute('data-id');
        var title = project.querySelector('.title').innerText.trim();
        var author = project.querySelector('.owner a').innerText.trim();
        var thumbnail = project.querySelector('img').getAttribute('data-original');
        this.addProject(id, title, author, thumbnail);
      }
      this.onpageload();
      // All pages except the last have a next page button.
      if (!doc.querySelector('.next-page')) {
        this.ended = true;
        this.onend();
      }
      this.page++;
      this.loadingPage = false;
      this.root.removeAttribute('loading');
    }.bind(this);

    xhr.onerror = function() {
      this.root.setAttribute('error', '');
      this.addErrorElement();
      this.ended = true;
    }.bind(this);

    xhr.responseType = 'document';
    xhr.open('GET', url);
    xhr.send();
  };

  StudioView.prototype.setTheme = function(theme) {
    this.root.setAttribute('theme', theme);
  };

  StudioView.prototype.onselect = function(id) {};
  StudioView.prototype.onpageload = function() {};
  StudioView.prototype.onend = function() {};

  // This can be any URL that is a proxy for https://scratch.mit.edu/site-api/projects/in/5235006/1/
  // Understandably scratch does not set CORS headers on this URL, but a proxy can set it manually.
  // I setup a proxy @ scratch.garbomuffin.com that does this.
  // $id will be replaced with the studio id, and $page with the page.
  StudioView.STUDIO_API = 'https://scratch.garbomuffin.com/api/site-api/projects/in/$id/$page/';

  scope.StudioView = StudioView;
}(window));
