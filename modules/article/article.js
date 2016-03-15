/*
  The Article module displays articles stored
  within an XML database file.
*/

/*
  The global article_SETTINGS_URL variable
  specifies the location of the module settings
  file.
*/
var article_SETTINGS_URL = 'modules/article/settings.xml';

/*
  The global article_ARTICLES variable is an
  associative array that stores the loaded articles
  keyed by id.
*/
var article_ARTICLES = {};

// The module's load event handler.
MODULE_LOAD_HANDLERS.add (
  function (done) {
    // I. Load the module settings.
    article_loadSettings (article_SETTINGS_URL,
      function (settings) {
        // II. Load the articles.
        article_loadArticles (settings.articles,
          function (articles) {
            // III. Cache the loaded articles.
            article_ARTICLES = articles;

            // IV. Register the block handlers.
            block_HANDLERS.addHandlers ({
              article_article_list_block: article_articleListBlock,
              article_article_block:      article_articleBlock,
              article_author_block:       article_authorBlock,
              article_body_block:         article_bodyBlock,
              article_date_block:         article_dateBlock,
              article_summary_block:      article_summaryBlock,
              article_title_block:        article_titleBlock
            });

            // V. Register the page handlers.
            page_HANDLERS.add ('article_article_page', 'modules/article/templates/article_page.html');

            done ();
          },
          done
        );
      },
      done
    );
});

/*
  article_loadSettings accepts three arguments:

  * url, a URL string
  * success, a function that accepts an Article
    Settings object
  * and failure, a function that does not accept
    any arguments.

  article_loadSettings loads and parses the Article
  Settings document referenced by url and passes
  the result to success. If an error occurs, it
  calls failure instead. 
*/
function article_loadSettings (url, success, failure) {
  $.ajax (url, {
    dataType: 'xml',
    success: function (doc) {
      success (article_parseSettings (doc));
    },
    error: function (request, status, error) {
      strictError ('[article][article_loadSettings] Error: an error occured while trying to load the article settings.xml file from "' + url + '". ' + error);
      failure ();
    }
  });
}

/*
  article_parseSettings accepts an XML Document
  string that represents an Article Settings
  Document, parses the document, and returns an
  Article Settings object.
*/
function article_parseSettings (doc) {
  return {
    articles: $('settings > articles', doc).text ()
  };
}

/*
  article_loadArticles accepts three arguments:

  * url, a URL string
  * success, a function that accepts an
    associative array of Articles keyed by article
    id
  * and failure, a function that does not accept
    any arguments.

  article_loadArticles loads the Articles Database
  XML Document referenced by url, parses the
  document, and passes the parsed articles to
  success.

  If an error occurs, article_loadArticles throws a
  strict error and calls failure.  
*/
function article_loadArticles (url, success, failure) {
  $.ajax (url, {
    dataType: 'xml',
    success: function (doc) {
      success (article_parseArticles (doc));
    },
    error: function (request, status, error) {
      strictError ('[article][article_loadArticles] Error: an error occured while trying to load the articles database "' + url + '". ' + error);
      failure ();
    }
  });
}

/*
  article_parseArticles accepts one argument, doc,
  an Articles Database XML Document string and
  returns an array of Articles. 
*/
function article_parseArticles (doc) {
  var articles = {};
  $('article', doc).each (
    function (articleIndex, articleElement) {
      var article = article_parseArticle (articleElement);
      articles [article.id] = article;
  });
  return articles;
}

/*
  article_parseArticle accepts an Article XML
  Element string and returns an Article that
  represents the article described by the string.
*/
function article_parseArticle (articleElement) {
  var id = new URI ('article_article_page')
    .segmentCoded ($('> id', articleElement).text ())
    .toString ();

  return {
    id:      id,
    title:   $('> title', articleElement).text (),
    date:    $('> date', articleElement).text (),
    author:  $('> author', articleElement).text (),
    summary: $('> summary', articleElement).text (),
    body:    $('> body', articleElement).text ()
  };  
}

/*
  article_articleListBlock accepts two arguments:

  * context, a Block Expansion Context
  * and done, a function that accepts a JQuery
    HTML Element.

  article_articleListBlock replaces context.element
  with a new HTML element that lists the articles
  stored in the articles database and passes the
  new element to done.
*/
function article_articleListBlock (context, done) {
  var element = article_createArticleListElement ();
  context.element.replaceWith (element);
  done (element);
}

/*
  article_articleBlock accepts three arguments:

  * context, a Block Expansion Context
  * success, a function that accepts a JQuery HTML
    Element
  * and failure, a function that does not accept
    any arguments.

  context.element must contain a single text node
  representing a valid article id.

  article_articleBlock replaces context.element with a
  new HTML element that represents the referenced
  article and passes the new element to success. If
  an error occurs, article_articleBlock calls
  failure instead. 
*/
function article_articleBlock (context, success, failure) {
  var articleId = context.element.text ();
  var article = article_ARTICLES [articleId];
  if (!article) {
    strictError ('[article][article_articleBlock] Error: an error occured while trying to expand an article block. The referenced article does not exist.');
    return failure ();
  }
  element = article_createArticleElement (article);
  context.element.replaceWith (element);
  success (element);
}

/*
  article_authorBlock accepts three arguments:

  * context, a Block Expansion Context
  * success, a function that accepts a JQuery HTML
    Element
  * and failure, a function that does not accept
    any arguments.

  context.element must contain a single text node
  representing a valid article id.

  article_authorBlock replaces context.element with a
  new HTML element that represents the referenced
  article's author and passes the new element to
  success. If an error occurs, article_authorBlock
  calls failure instead. 
*/
function article_authorBlock (context, success, failure) {
  var articleId = context.element.text ();
  var article = article_ARTICLES [articleId];
  if (!article) {
    strictError ('[article][article_authorBlock] Error: an error occured while trying to expand an article author block. The referenced article does not exist.');
    return failure ();
  }
  var element = article_createAuthorElement (article.author);
  context.element.replaceWith (element);
  success (element);
}

/*
  article_bodyBlock accepts three arguments:

  * context, a Block Expansion Context
  * success, a function that accepts a JQuery HTML
    Element
  * and failure, a function that does not accept
    any arguments.

  context.element must contain a single text node
  representing a valid article id.

  article_bodyBlock replaces context.element with a
  new HTML element that represents the referenced
  article's body and passes the new element to
  success. If an error occurs, article_bodyBlock
  calls failure instead. 
*/
function article_bodyBlock (context, success, failure) {
  var articleId = context.element.text ();
  var article = article_ARTICLES [articleId];
  if (!article) {
    strictError ('[article][article_bodyBlock] Error: an error occured while trying to expand an article body block. The referenced article does not exist.');
    return failure ();
  }
  var element = article_createBodyElement (article.body);
  context.element.replaceWith (element);
  success (element);
}

/*
  article_dateBlock accepts three arguments:

  * context, a Block Expansion Context
  * success, a function that accepts a JQuery HTML
    Element
  * and failure, a function that does not accept
    any arguments.

  context.element must contain a single text node
  representing a valid article id.

  article_dateBlock replaces context.element with a
  new HTML element that represents the referenced
  article's date and passes the new element to
  success. If an error occurs, article_dateBlock
  calls failure instead. 
*/
function article_dateBlock (context, success, failure) {
  var articleId = context.element.text ();
  var article = article_ARTICLES [articleId];
  if (!article) {
    strictError ('[article][article_dateBlock] Error: an error occured while trying to expand an article date block. The referenced article does not exist.');
    return failure ();
  }
  var element = article_createDateElement (article.date);
  context.element.replaceWith (element);
  success (element);
}

/*
  article_summaryBlock accepts three arguments:

  * context, a Block Expansion Context
  * success, a function that accepts a JQuery HTML
    Element
  * and failure, a function that does not accept
    any arguments.

  context.element must contain a single text node
  representing a valid article id.

  article_summaryBlock replaces context.element with a
  new HTML element that represents the referenced
  article's summary and passes the new element to
  success. If an error occurs, article_summaryBlock
  calls failure instead. 
*/
function article_summaryBlock (context, success, failure) {
  var articleId = context.element.text ();
  var article = article_ARTICLES [articleId];
  if (!article) {
    strictError ('[article][article_summaryBlock] Error: an error occured while trying to expand an article summary block. The referenced article does not exist.');
    return failure ();
  }
  var element = article_createSummaryElement (article.summary);
  context.element.replaceWith (element);
  success (element);
}

/*
  article_titleBlock accepts three arguments:

  * context, a Block Expansion Context
  * success, a function that accepts a JQuery HTML
    Element
  * and failure, a function that does not accept
    any arguments.

  context.element must contain a single text node
  representing a valid article id.

  article_titleBlock replaces context.element with a
  new HTML element that represents the referenced
  article's title and passes the new element to
  success. If an error occurs, article_titleBlock
  calls failure instead. 
*/
function article_titleBlock (context, success, failure) {
  var articleId = context.element.text ();
  var article = article_ARTICLES [articleId];
  if (!article) {
    strictError ('[article][article_titleBlock] Error: an error occured while trying to expand an article title block. The referenced article does not exist.');
    return failure ();
  }
  var element = article_createTitleElement (article.title);
  context.element.replaceWith (element);
  success (element);
}

/*
  article_createArticleListElement returns a JQuery
  HTML element that lists the articles stored in
  the articles database.
*/
function article_createArticleListElement () {
  var articleListElement = $('<ul></ul>').addClass ('article_list');
  for (var articleId in article_ARTICLES) {
    var article = article_ARTICLES [articleId];
    articleListElement.append (
      $('<li></li>')
        .addClass ('article_list_item')
        .append (article_createArticleSummaryElement (article)));
  }
  return articleListElement;
}

/*
  article_createArticleElement accepts an Article
  and returns a JQuery HTML Element that represents
  the article.
*/
function article_createArticleElement (article) {
  return $('<div></div>')
    .addClass ('article_article')
    .append ($('<div></div>')
      .addClass ('article_header')
      .append ($('<h2></h2>')
        .addClass ('article_header_title')
        .append (article_createTitleElement (article.title))))
    .append (
      $('<div></div>')
        .addClass ('article_byline')
        .append (
          article_createDateElement (article.date),
          article_createAuthorElement (article.author)),
      article_createBodyElement (article.body));
}

/*
  article_createArticleSummaryElement accepts an
  Article and returns a JQuery HTML Element that
  represents a summary of the article.
*/
function article_createArticleSummaryElement (article) {
  return $('<div></div>')
    .addClass ('article_article_summary')
    .append ($('<div></div>')
      .addClass ('article_header')
      .append (
        $('<h2></h2>')
          .addClass ('article_header_title')
          .append (article_createLinkElement (article))))
    .append (
      $('<div></div>')
        .addClass ('article_byline')
        .append (
          article_createDateElement   (article.date),
          article_createAuthorElement (article.author)),
      article_createSummaryElement (article.summary));
}

/*
  article_createAuthorElement accepts an HTML
  string that represents an author's name and
  returns a JQuery HTML element that represents
  the author's name.
*/
function article_createAuthorElement (author) {
  return $('<span></span>').addClass ('article_author').html (author);
}

/*
  article_createBodyElement accepts an HTML string
  that represents an article's body and returns a
  JQuery HTML Element that represents the body.
*/
function article_createBodyElement (body) {
  return $('<div></div>').addClass ('article_body').html (body);
}

/*
  article_createDateElement accepts a string that
  represents an article's publication date and
  returns a JQuery HTML Element that represents the
  date.
*/
function article_createDateElement (date) {
  return $('<span></span>').addClass ('article_date').text (date); 
}

/*
  article_createSummaryElement accepts an HTML
  string that represents an article's summary and
  returns a JQuery HTML Element that represents the
  summary.
*/
function article_createSummaryElement (summary) {
  return $('<div></div>').addClass ('article_summary').html (summary);
}

/*
  article_createLinkElement accepts an Article and
  returns a JQuery HTML Element that represents a
  link to the article.
*/
function article_createLinkElement (article) {
  return getContentLink (article.id, article_createTitleElement (article.title)).addClass ('article_link');
}

/*
  article_createTitleElement accepts an HTML string
  that represents an article's title and returns a
  JQuery HTML Element that represents the title.
*/
function article_createTitleElement (title) {
  return $('<span></span>').addClass ('article_title').html (title);
}