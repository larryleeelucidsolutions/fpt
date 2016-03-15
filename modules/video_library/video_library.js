var video_library_SNIPPET_LENGTH = 500;

var video_library_DATABASE_URL = 'modules/video_library/database.xml';

var video_library_DATABASE = {};

/*
  The module's load event handler.
*/
MODULE_LOAD_HANDLERS.add (
  function (done) {
    // I. Load the Video Database.
    video_library_loadDatabase (video_library_DATABASE_URL,
      function (database) {
        // II. Cache the Video Library.
        video_library_DATABASE = database;

        // III. Register the module's block handler.
        block_HANDLERS.addHandlers ({
          'video_library_description_block': video_library_descriptionBlock,
          'video_library_menu_block':        video_library_menuBlock,
          'video_library_player_block':      video_library_playerBlock,
          'video_library_title_block':       video_library_titleBlock,
          'video_library_transcript_block':  video_library_transcriptBlock
        });

        // IV. Register the module's page handler.
        page_HANDLERS.add ('video_library_page', 'modules/video_library/templates/video_library_page.html');

        // V. Register the module's search source.
        search_registerSource ('video_library_search_source', video_library_searchSource);

        done ();
      },
      done
    );
});

function video_library_descriptionBlock (context, success, failure) {
  getBlockArguments ([
      {'name': 'video_library_player_id',    'text': true, 'required': true},
      {'name': 'video_library_library_id',   'text': true, 'required': true},
      {'name': 'video_library_default_text', 'text': true, 'required': false}
    ], context.element,
    function (blockArguments) {
      var next = function (descriptionElement) {
        context.element.replaceWith (descriptionElement);
        success (descriptionElement);
      }

      var defaultText = blockArguments.video_library_default_text;
      if (!defaultText) {
        defaultText = '<p><em>No description available.</em></p>';
      }

      var libraryId   = blockArguments.video_library_library_id;
      var libraryPath = video_library_getPath (libraryId);
      var libraryName = video_library_getLibraryName (libraryPath);
      var library = video_library_DATABASE [libraryName];
      if (!library) {
        strictError ();
        return failure ();
      }

      var videoURL = video_library_getVideoURL (libraryPath);

      var playerId = blockArguments.video_library_player_id;
      var descriptionElement = library.createDescriptionElement (playerId, defaultText, videoURL);

      context.element.replaceWith (descriptionElement);
      success (descriptionElement);
    },
    failure
  );
}

function video_library_menuBlock (context, success, failure) {
  getBlockArguments ([
      {'name': 'video_library_player_id',  'text': true, 'required': true},
      {'name': 'video_library_library_id', 'text': true, 'required': true}
    ], context.element,
    function (blockArguments) {
      var libraryId   = blockArguments.video_library_library_id;
      var libraryPath = video_library_getPath (libraryId);
      var libraryName = video_library_getLibraryName (libraryPath);
      var library = video_library_DATABASE [libraryName];
      if (!library) {
        strictError ();
        return failure ();
      }

      var videoURL = video_library_getVideoURL (libraryPath);

      var playerId = blockArguments.video_library_player_id;
      var menuElement = library.createMenuElement (playerId, videoURL);

      context.element.replaceWith (menuElement);
      success (menuElement);
    },
    failure
  );
}

function video_library_playerBlock (context, success, failure) {
  getBlockArguments ([
      {'name': 'video_library_player_id',        'text': true, 'required': true},
      {'name': 'video_library_default_video_id', 'text': true, 'required': false}
    ], context.element,
    function (blockArguments) {
      var playerId = blockArguments.video_library_player_id;

      var videoElement = $('<video></video>')
        .attr     ('id', playerId)
        .addClass ('video-js')
        .addClass ('vjs-default-skin')
        .attr     ('controls', 'controls')
        .attr     ('width', '100%')
        .attr     ('height', '400px');

      var playerElement = $('<div></div>')
        .addClass ('video_player_block')
        .append (videoElement);

      var videoId   = blockArguments.video_library_default_video_id;
      var videoPath = video_library_getPath (videoId);
      var videoURL  = video_library_getVideoURL (videoPath);
      if (videoURL) {
        videoElement.append ($('<source></source>').attr ('src', videoURL));
      }

      context.element.replaceWith (playerElement);
      success (playerElement);
    },
    failure
  );
}

function video_library_titleBlock (context, success, failure, expand) {
  getBlockArguments ([
      {'name': 'video_library_player_id',    'text': true, 'required': true},
      {'name': 'video_library_library_id',   'text': true, 'required': true}
    ], context.element,
    function (blockArguments) {
      var libraryId   = blockArguments.video_library_library_id;
      var libraryPath = video_library_getPath (libraryId);
      var libraryName = video_library_getLibraryName (libraryPath);
      var library = video_library_DATABASE [libraryName];
      if (!library) {
        strictError ();
        return failure ();
      }

      var videoURL = video_library_getVideoURL (libraryPath);

      var video = videoURL ? library.getVideo (videoURL) : null;

      var title = video ? video.title : library.title;

      var titleElement = $('<span></span>').addClass ('video_library_title').html (title);

      var playerId = blockArguments.video_library_player_id;
      video_registerLoadHandler (playerId,
        function (player) {
          player.on ('loadeddata',
            function () {
              var video = library.getVideo (player.currentSrc ());
              titleElement.html (video.title);
              expand (titleElement, function () {});
          });
      });

      context.element.replaceWith (titleElement);
      success (titleElement);
    },
    failure
  );
}

function video_library_transcriptBlock (context, success, failure, expand) {
  getBlockArguments ([
      {'name': 'video_library_player_id',    'text': true, 'required': true},
      {'name': 'video_library_library_id',   'text': true, 'required': true},
      {'name': 'video_library_default_text', 'text': true, 'required': false}
    ], context.element,
    function (blockArguments) {
      var next = function (transcriptElement) {
        context.element.replaceWith (transcriptElement);
        success (transcriptElement);
      }

      var defaultText = blockArguments.video_library_default_text;
      if (!defaultText) {
        defaultText = '<p><em>No transcript available.</em></p>';
      }

      var libraryId   = blockArguments.video_library_library_id;
      var libraryPath = video_library_getPath (libraryId);
      var libraryName = video_library_getLibraryName (libraryPath);
      var library = video_library_DATABASE [libraryName];
      if (!library) {
        strictError ();
        return failure ();
      }

      var videoURL = video_library_getVideoURL (libraryPath);

      var playerId = blockArguments.video_library_player_id;
      library.createTranscriptElement (playerId, defaultText, videoURL,
        function (transcriptElement) {
          context.element.replaceWith (transcriptElement);
          success (transcriptElement);
        },
        failure,
        expand
      );
    },
    failure
  );
}

/*
*/
function video_library_searchSource (libraryName, success, failure) {
  var set = [];
  var library = video_library_DATABASE [libraryName];
  if (!library) {
    strictError ();
    return failure ();
  }
  library.getAllVideos ().forEach (
    function (video) {
      set.push (new video_library_VideoEntry (
          video.id,
          $('<div>' + video.title + '</div>').text (),
          $('<div>' + video.description + '</div>').text ()
      ));
  });
  success (set);
}

/*
*/
function video_library_VideoEntry (id, title, body) {
  search_Entry.call (this, id);
  this.title = title;
  this.body  = body;
}

/*
*/
video_library_VideoEntry.prototype = Object.create (video_library_VideoEntry.prototype);

/*
*/
video_library_VideoEntry.prototype.getResultElement = function (done) {
  done ($('<li></li>')
    .addClass ('search_result')
    .addClass ('book_search_result')
    .addClass ('book_search_page_result')
    .append (getContentLink (this.id)
      .addClass ('search_result_link')
      .addClass ('book_search_link')
      .addClass ('book_search_page_link')
      .attr ('href', getContentURL (this.id))
      .append ($('<h3></h3>').html (this.title))
      .append ($('<p></p>').text (video_library_getSnippet (this.body)))));
}

function video_library_Video (id, url, title, description, duration, transcriptURL) {
  this.id            = id;
  this.url           = url;
  this.title         = title;
  this.description   = description;
  this.duration      = duration;
  this.transcriptURL = transcriptURL;
}

video_library_Video.prototype.createMenuItemElement = function (playerId, videoURL, libraryName, libraryMenuElement) {
  var element = $('<li></li>')
    .addClass ('video_library_video')
    .append ($('<a></a>')
      .attr ('href', '#' + this.id)
      .append ($('<h4></h4>')
        .addClass ('video_library_title')
        .addClass ('video_library_video_title')
        .html (this.title + '<span class="video_library_time">' + video_library_timeToString (this.duration) + '</span>')));

  if (this.url === videoURL) {
    element.addClass ('video_library_selected');
  }

  // var self = this;
  element.click (
    function (event) {
      // Prevent the parent element's onclick event handler from firing.
      event.stopPropagation ();

      // Deselect the currently selected element.
      $('.video_library_selected', libraryMenuElement).removeClass ('video_library_selected');

      // Select the current element.
      element.addClass ('video_library_selected');

      video_registerLoadHandler (playerId,
        function (player) {
          if (player) {
            // Play the video URL in the player.
            // player.pause ();
            // player.src (self.url);
          };
      });
  });

  return element;
}

video_library_Video.prototype.createDescriptionContent = function () {
  return '<div><div>' + this.title + '</div><div>' + this.description + '</div></div>';
}

function video_library_parseVideo (collectionPath, videoElement) {
  var url  = $('> url', videoElement).text ();
  var path = collectionPath.concat (url);
  return new video_library_Video (
    video_library_createId (path),
    url,
    $('> title', videoElement).text (),
    $('> description', videoElement).text (),
    video_library_convertToSeconds ($('> duration', videoElement).text ()),
    $('> transcript', videoElement).text ()
  );
}

function video_library_videosMenuItemElements (playerId, videoURL, libraryName, libraryMenuElement, videos) {
  return videos.map (
    function (video) {
      return video.createMenuItemElement (playerId, videoURL, libraryName, libraryMenuElement)
  });
}

function video_library_Collection (id, name, title, description, collections, videos) {
  this.id          = id;
  this.name        = name;
  this.title       = title;
  this.description = description;
  this.collections = collections;
  this.videos      = videos;
}

video_library_Collection.prototype.createMenuItemElement = function (playerId, videoURL, libraryName, libraryMenuElement) {
  var item = $('<li></li>')
    .addClass ('video_library_collection')
    .addClass ('video_library_expanded')
    .append ($('<h3></h3>')
      .addClass ('video_library_title')
      .addClass ('video_library_collection_title')
      .html (this.title + '<span class="video_library_time">' + video_library_timeToString (this.getDuration ()) + '</span>'))
    .append ($('<div></div>')
      .addClass ('video_library_description')
      .addClass ('video_library_collection_description')
      .html (this.description));

  var contents = $('<ol></ol>')
    .append (video_library_collectionsMenuItemElements (playerId, videoURL, libraryName, libraryMenuElement, this.collections))
    .append (video_library_videosMenuItemElements (playerId, videoURL, libraryName, libraryMenuElement, this.videos));

  item.append (contents);

  item.click (
    function (event) {
      item.toggleClass ('video_library_expanded');
      contents.slideToggle ();
  });

  return item;
}

video_library_Collection.prototype.getDuration = function () {
  var duration = 0;
  for (var i = 0; i < this.videos.length; i ++) {
    duration += this.videos [i].duration;
  }
  return duration;
}

video_library_Collection.prototype.getVideo = function (videoURL) {
  for (var i = 0; i < this.videos.length; i ++) {
    if (this.videos [i].url === videoURL) {
      return this.videos [i];
    }
  }
  for (var i = 0; i < this.collections.length; i ++) {
    var collection = this.collections [i];
    var video = collection.getVideo (videoURL);
    if (video) {
      return video;
    }
  }
  return null;
}

video_library_Collection.prototype.getAllVideos = function () {
  var videos = [];
  Array.prototype.push.apply (videos, this.videos);
  for (var i = 0; i < this.collections.length; i ++) {
    Array.prototype.push.apply (videos, this.collections [i].getAllVideos ());
  }
  return videos;
}

function video_library_parseCollection (libraryPath, collectionElement) {
  var name = $('> name', collectionElement).text ();
  var path = libraryPath.concat (name);
  return new video_library_Collection (
    video_library_createId (path),
    name,
    $('> title', collectionElement).text (),
    $('> description', collectionElement).text (),
    $('> collection', collectionElement).map (
      function (i, collectionElement) {
        return video_library_parseCollection (path, collectionElement);
    }).toArray (),
    $('> video', collectionElement).map (
      function (i, videoElement) {
        return video_library_parseVideo (path, videoElement);
    }).toArray ()
  );
}

function video_library_collectionsMenuItemElements (playerId, videoURL, libraryName, libraryMenuElement, collections) {
  return collections.map (
    function (collection) {
      return collection.createMenuItemElement (playerId, videoURL, libraryName, libraryMenuElement);
  });
}

function video_library_Library (id, name, title, description, collections, videos) {
  video_library_Collection.call (this, id, name, title, description, collections, videos);
}

video_library_Library.prototype = Object.create (video_library_Collection.prototype);

video_library_Library.prototype.createMenuElement = function (playerId, videoURL) {
  var libraryMenuElement = $('<div></div>')
    .addClass ('video_library_menu')
    .append ($('<h2></h2>')
      .addClass ('video_library_title')
      .addClass ('video_library_library_title')
      .html (this.title))
    .append ($('<div></div>')
      .addClass ('video_library_description')
      .addClass ('video_library_library_description')
      .html (this.description));

  libraryMenuElement.append ($('<ol></ol>')
    .append (video_library_collectionsMenuItemElements (playerId, videoURL, this.name, libraryMenuElement, this.collections))
    .append (video_library_videosMenuItemElements (playerId, videoURL, this.name, libraryMenuElement, this.videos)));

  return libraryMenuElement;
}

video_library_Library.prototype.createDescriptionElement = function (playerId, defaultText, videoURL) {
  var video = videoURL ? this.getVideo (videoURL) : null;

  var descriptionElement = $('<div></div>')
    .addClass ('video_library_description')
    .addClass ('video_library_video_description')
    .html (video ? video.createDescriptionContent () : defaultText);

  var self = this;
  video_registerLoadHandler (playerId,
    function (player) {
      player.on ('loadeddata',
        function () { 
          var video = self.getVideo (player.currentSrc ());
          descriptionElement.empty ().html (video ? video.createDescriptionContent () : defaultText);
      });
  });

  return descriptionElement;
}

video_library_Library.prototype.createTranscriptElement = function (playerId, defaultText, videoURL, success, failure, expand) {
  var transcriptElement = $('<div></div>').addClass ('video_library_transcript');

  var self = this;

  video_registerLoadHandler (playerId,
    function (player) {
      player.on ('loadeddata',
        function () {
          transcriptElement.empty ();

          var displayDefaultText = function () {
            transcriptElement.html (defaultText);
          }

          var video = self.getVideo (player.currentSrc ());
          if (video.transcriptURL) {
            return video_library_loadTranscript (video.transcriptURL,
              function (captions) {
                expand (transcriptElement.append (video_library_createCaptionElements (captions, playerId)),
                  function () {});
              },
              displayDefaultText
            );
          }
          displayDefaultText ();
      });

      player.on ('timeupdate',
        function () {
          // TODO: Can I use a "this" reference here?
          video_library_highlightTranscriptElement (transcriptElement, player.currentTime ());
      });
  });

  if (videoURL) {
    var video = this.getVideo (videoURL);
    if (!video) {
      strictError ();
      return failure ();
    }
    if (!video.transcriptURL) {
      return success (transcriptElement);
    }
    return video_library_loadTranscript (video.transcriptURL,
      function (captions) {
        success (transcriptElement.append (video_library_createCaptionElements (captions, playerId)));
      },
      failure
    );
  }
  success (transcriptElement);
}

function video_library_parseLibrary (libraryElement) {
  var name = $('library > name', libraryElement).text ();
  var path = [name];
  return new video_library_Library (
    video_library_createId (path),
    name,
    $('library > title', libraryElement).text (),
    $('library > description', libraryElement).text (),
    $('library > collection', libraryElement).map (
      function (i, collectionElement) {
        return video_library_parseCollection (path, collectionElement);
    }).toArray (),
    $('> video', libraryElement).map (
      function (i, videoElement) {
        return video_library_parseVideo (path, videoElement);
    }).toArray ()
  );
}

function video_library_loadDatabase (databaseURL, success, failure) {
  $.get (databaseURL,
    function (databaseElement) {
      success (video_library_parseDatabase (databaseElement));
    },
    'xml'
  )
  .fail (function () {
    strictError ('[video_library][video_library_loadDatabase] Error: an error occured while trying to load "' + databaseURL + '".');
    failure ();
  });
}

function video_library_parseDatabase (databaseElement) {
  var database = {};
  $('database > library', databaseElement).each (
    function (i, libraryElement) {
      var library = video_library_parseLibrary (libraryElement);
      database [library.name] = library;
  });

  return database;
}

function video_library_Caption (start, end, text) {
  this.start = start;
  this.end   = end;
  this.text  = text;
}

video_library_Caption.prototype.createElement = function (playerId) {
  var captionElement = $('<span></span>')
    .addClass ('video_library_caption')
    .attr ('data-start', this.start)
    .attr ('data-end', this.end)
    .text (this.text);

  if (playerId) {
    var self = this;
    captionElement.click (
      function () {
        video_registerLoadHandler (playerId,
          function (player) {
            player.currentTime (self.start);
            player.play ();
        });
    });
  }

  return captionElement;
}

function video_library_parseCaption (captionElement) {
  return new video_library_Caption (
    video_library_convertToSeconds (captionElement.attr ('begin')),
    video_library_convertToSeconds (captionElement.attr ('end')),
    captionElement.text ()
  );
}

function video_library_createCaptionElements (captions, playerId) {
  return captions.map (function (caption) { return caption.createElement (playerId); });
}

function video_library_loadTranscript (transcriptURL, success, failure) {
  $.get (transcriptURL,
    function (transcriptElement) {
      success (video_library_parseTranscript (transcriptElement));
    },
    'xml'
  )
  .fail (function () {
    strictError ('[video_library][video_library_loadTranscript] Error: an error occured while trying to load a Video Transcript "' + transcriptURL + '".');
    failure ();
  });
}

function video_library_parseTranscript (transcriptElement) {
  return $('p', transcriptElement).map (
    function (i, captionElement) {
      return video_library_parseCaption ($(captionElement));
  }).toArray ();
}

function video_library_highlightTranscriptElement (transcriptElement, time) {
  $('> .video_library_caption', transcriptElement).each (
    function (captionElementIndex, captionElement) {
      if ($(captionElement).attr ('data-start') < time && time < $(captionElement).attr ('data-end')) {
        $(captionElement).addClass ('video_library_caption_active');
      } else {
        $(captionElement).removeClass ('video_library_caption_active');
      }    
  });
}

function video_library_createId (videoPath) {
  var uri = new URI ('').segmentCoded ('video_library_page');
  for (var i = 0; i < videoPath.length; i ++) {
    uri.segmentCoded (videoPath [i]);
  }
  return uri.toString ();
}

function video_library_getPath (videoId) {
  var path = new URI (videoId).segmentCoded ();
  if (path.length < 2) {
    strictError ('[video_library][video_library_getPath] Error: "' + videoId + '" is an invalid video ID.');
    return null;
  }
  path.shift ();
  return path;
}


function video_library_getLibraryName (videoPath) {
  return videoPath [0];
}

function video_library_getVideoURL (videoPath) {
  return videoPath.length < 2 ? null : videoPath [videoPath.length - 1];
}

/*
  video_library_convertToSeconds accepts
  one argument: time, a string that represents
  a duration; and returns an integer that
  represents time as the number of seconds.
*/
function video_library_convertToSeconds (time) {
  var xs = time.split (':');
  var seconds = 0;
  for (var i = 0; i < xs.length; i ++) {
    seconds += Number (xs [i]) * Math.pow (60, (xs.length - 1) - i);
  }
  return seconds;
}

/*
  video_library_timeToString accepts one
  argument: time, a number that represents a
  duration; and returns a string that represents
  the duration.
*/
function video_library_timeToString (time) {
  var hours = parseInt (time / 3600);
  var minutes = parseInt ((time - (hours * 3600)) / 60);
  var seconds = time - (hours * 3600) - (minutes * 60);

  var timeString = '';
  if (hours)   { timeString += hours + 'h'; }
  if (minutes) { timeString += (timeString ? ' ' : '') + minutes + 'm'; }
  if (seconds) { timeString += (timeString ? ' ' : '') + seconds + 's'; }
  return timeString;
}

/*
  video_library_getSnippet accepts an
  HTML string and returns a snippet of the
  text contained within the given HTML as a
  string.
*/
function video_library_getSnippet (text) {
  return text.length <= video_library_SNIPPET_LENGTH ? text :
    text.substr (0, video_library_SNIPPET_LENGTH) + '...';
}