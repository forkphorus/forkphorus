(function (scope) {
  'use strict';

  /**
   * @class
   */
  var StudioView = function (studioId) {
    this.studioId = studioId;
    this.offset = 0;
    this.ended = false;
    this.loadingPage = false;
    this.unusedPlaceholders = [];

    this.root = document.createElement('div');
    this.root.className = 'studioview-root';
    this.projectList = document.createElement('div');
    this.projectList.className = 'studioview-list';
    this.root.appendChild(this.projectList);
    this.setTheme('light');

    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(this.handleIntersection.bind(this), {
        root: this.projectList,
        rootMargin: '25px 0px 25px 0px',
      });
      this.loadNextPageObserver = new IntersectionObserver(this.handleLoadNextPageIntersection.bind(this), {
        root: this.projectList
      });
    } else {
      this.intersectionObserver = null;
      this.loadNextPageObserver = null;
    }
  };

  /**
   * Add a project to the view.
   * An unused placeholder element may be used, or it may be created.
   */
  StudioView.prototype.addProject = function (details) {
    var el;
    if (this.unusedPlaceholders.length) {
      el = this.unusedPlaceholders.shift();
    } else {
      el = this.createPlaceholder();
      this.projectList.appendChild(el);
    }
    this.placeholderToProject(el, details.id, details.title, details.author);
  };

  /**
   * Create an <img> element that will load only when it becomes visible.
   */
  StudioView.prototype.createLazyImage = function (src) {
    var el = document.createElement('img');
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(el);
      el.className = 'studioview-lazy';
      el.dataset.src = src;
    } else {
      // then we just won't lazy load it
      el.src = src;
    }
    return el;
  };

  /**
   * Create a placeholder or placeholder element.
   */
  StudioView.prototype.createPlaceholder = function () {
    var el = document.createElement('a');
    el.className = 'studioview-project studioview-placeholder';

    var thumbnail = document.createElement('div');
    thumbnail.className = 'studioview-thumbnail';

    var title = document.createElement('div');
    title.className = 'studioview-title';

    var author = document.createElement('div');
    author.className = 'studioview-author';

    el.thumbnailEl = thumbnail;
    el.titleEl = title;
    el.authorEl = author;

    el.appendChild(thumbnail);
    el.appendChild(title);
    el.appendChild(author);

    return el;
  };

  /**
   * Convert a placeholder element made by createPlaceholder to a project element.
   */
  StudioView.prototype.placeholderToProject = function (el, id, title, author) {
    el.className = 'studioview-project studioview-loaded';
    el.dataset.id = id;
    el.dataset.title = title;
    el.dataset.author = author;
    el.title = StudioView.PROJECT_HOVER_TEXT.replace('$author', author).replace('$title', title);
    el.href = StudioView.PROJECT_PAGE.replace('$id', id);

    var thumbnailSrc = StudioView.THUMBNAIL_SRC.replace('$id', id);
    var thumbnailImg = this.createLazyImage(thumbnailSrc);
    el.thumbnailEl.appendChild(thumbnailImg);

    el.titleEl.innerText = title;
    el.authorEl.innerText = StudioView.AUTHOR_ATTRIBUTION.replace('$author', author);

    el.addEventListener('click', this.handleClick.bind(this), true);
    el.addEventListener('keydown', this.handleKeyDown.bind(this), true);

    return el;
  };

  /**
   * Adds an error message to the list.
   */
  StudioView.prototype.addErrorElement = function () {
    var el = document.createElement('div');
    el.innerText = StudioView.LOAD_ERROR;
    el.className = 'studioview-error';
    this.projectList.appendChild(el);
  };

  StudioView.prototype.handleLoadNextPageIntersection = function (e) {
    for (var i = 0; i < e.length; i++) {
      var intersection = e[i];
      if (intersection.intersectionRatio > 0 && this.canLoadNext()) {
        this.loadNextPage();
      }
    }
  };

  // Click a project element or a child of a project element
  StudioView.prototype.clickProject = function (el) {
    while (!el.classList.contains('studioview-project')) {
      el = el.parentNode;
    }
    var id = el.dataset.id;
    this.onselect(id, el);
  }

  // Called when click is fired on a project element
  StudioView.prototype.handleClick = function (e) {
    e.preventDefault();
    this.clickProject(e.target);
  };

  // Called when keydown is fired on a project element
  StudioView.prototype.handleKeyDown = function (e) {
    if (e.keyCode === 13) {
      // treat enter (13) as click
      e.preventDefault();
      this.clickProject(e.target);
    }
  };

  // Called by the IntersectionObserver when it sees an intersection
  StudioView.prototype.handleIntersection = function (entries, observer) {
    entries.forEach(function (entry) {
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
  StudioView.prototype.canLoadNext = function () {
    return !this.loadingPage && !this.ended;
  };

  /**
   * Remove all unused placeholder elements.
   */
  StudioView.prototype.cleanupPlaceholders = function () {
    while (this.unusedPlaceholders.length) {
      var el = this.unusedPlaceholders.pop();
      this.projectList.removeChild(el);
    }
    if (this.loadNextPageObserver) {
      // If it doesn't exist, then I guess you won't be loading any more pages :shrug:
      this.loadNextPageObserver.disconnect();
      this.loadNextPageObserver.observe(this.projectList.lastChild);
    }
  };

  /**
   * Add placeholder placeholder elements.
   */
  StudioView.prototype.addPlaceholders = function () {
    if (this.loadNextPageObserver) {
      this.loadNextPageObserver.disconnect();
    }
    for (var i = 0; i < StudioView.PLACEHOLDER_COUNT; i++) {
      var el = this.createPlaceholder();
      this.unusedPlaceholders.push(el);
      this.projectList.appendChild(el);
    }
  };

  /**
   * Make changes to the order of projects.
   * Default shuffler does nothing.
   */
  StudioView.prototype.shuffler = function (projects) {
    return projects;
  };

  /**
   * Begins loading the next page.
   */
  StudioView.prototype.loadNextPage = function () {
    if (this.loadingPage) {
      throw new Error('Already loading the next page');
    }
    if (this.ended) {
      throw new Error('There are no more pages to load');
    }

    this.addPlaceholders();
    this.root.setAttribute('loading', '');
    this.loadingPage = true;

    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.onload = function () {
      var rawProjects = xhr.response;
      if (!Array.isArray(rawProjects)) {
        xhr.onerror();
        return;
      }
      var projects = [];
      for (var i = 0; i < rawProjects.length; i++) {
        var p = rawProjects[i];
        projects.push({
          id: p.id,
          title: p.title,
          author: p.username,
        });
      }
      projects = this.shuffler(projects);
      for (var i = 0; i < projects.length; i++) {
        this.addProject(projects[i]);
      }
      this.cleanupPlaceholders();

      if (rawProjects.length === 40) {
        if (this.loadNextPageObserver) {
          this.loadNextPageObserver.observe(this.projectList.lastChild);
        }
      } else {
        this.ended = true;
        this.onend();
      }

      this.offset += projects.length;
      this.loadingPage = false;
      this.root.removeAttribute('loading');

      this.onpageload();
    }.bind(this);

    xhr.onerror = function () {
      this.root.setAttribute('error', '');
      this.cleanupPlaceholders();
      this.addErrorElement();
      this.ended = true;
    }.bind(this);

    var url = StudioView.STUDIO_API
      .replace('$id', this.studioId)
      .replace('$offset', '' + this.offset);
    xhr.open('GET', url);
    xhr.send();
  };

  StudioView.prototype.setTheme = function (theme) {
    this.root.setAttribute('theme', theme);
  };

  StudioView.prototype.getURL = function () {
    return StudioView.STUDIO_PAGE.replace('$id', this.studioId);
  };

  StudioView.prototype.onselect = function (id, el) { };
  StudioView.prototype.onpageload = function () { };
  StudioView.prototype.onend = function () { };

  // Types of shufflers
  function shuffleList(list) {
    // https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
    for (var i = list.length - 1; i > 0; i--) {
      var random = Math.floor(Math.random() * (i + 1));
      var tmp = list[i];
      list[i] = list[random];
      list[random] = tmp;
    }
  }
  StudioView.Shufflers = {};
  StudioView.Shufflers.random = function (groupSize) {
    groupSize = groupSize || Infinity;
    return function (projects) {
      if (groupSize === Infinity) {
        shuffleList(projects);
        return projects;
      }
      var result = [];
      for (var i = 0; i < projects.length; i += groupSize) {
        var group = projects.slice(i, i + groupSize);
        shuffleList(group);
        for (var j = 0; j < group.length; j++) {
          result.push(group[j]);
        }
      }
      return result;
    };
  };

  StudioView.STUDIO_API = 'https://trampoline.turbowarp.org/proxy/studios/$id/projectstemporary/$offset';

  // The URL to download thumbnails from.
  // $id is replaced with the project's ID.
  StudioView.THUMBNAIL_SRC = 'https://cdn2.scratch.mit.edu/get_image/project/$id_144x108.png';

  // The URL for project pages.
  // $id is replaced with the project ID.
  StudioView.PROJECT_PAGE = 'https://scratch.mit.edu/projects/$id/';

  // The URL for studio pages.
  // $id is replaced with the studio ID.
  StudioView.STUDIO_PAGE = 'https://scratch.mit.edu/studios/$id/';

  // The text to appear under a project to credit the author of the project.
  // $author is replaced with the author's name.
  StudioView.AUTHOR_ATTRIBUTION = 'by $author';

  // The text to appear when hovering over a project.
  // $title becomes the project's title, $author becomes the author's name.
  StudioView.PROJECT_HOVER_TEXT = '$title by $author';

  // Displayed when the next page of projects could not be loaded.
  StudioView.LOAD_ERROR = 'There was an error loading the next page of projects.';

  // The amount of "placeholders" to insert before the next page loads.
  StudioView.PLACEHOLDER_COUNT = 9;

  scope.StudioView = StudioView;
}(window));
