//A vehicule for moving various objects around
var skwares = {};
skwares.panels = [];

var Skwitem = function(bookmark) {
	/*
	 * Associates a chrome.bookmarks node with its representation as a DOM
	 * element. Eventually refined as - either a Skware (a bookmark link) - or a
	 * Skwolder, that is the pairing of - a tab in a set of tabbed panels - a
	 * panel in same set of tabbed panels
	 */
	this.bookmark = bookmark;
	this.type = (bookmark.url) ? 'link' : 'folder';
	if (this.type === 'link') {
		this.spe = new Skware(this);
	} else {
		this.spe = new Skwolder(this);
	}

	this.spe.plantInDOM(this);

}

var Skwolder = function(skwitem) {
	/*
	 * A bookmark "folder" (non-terminal node) is materialized in the DOM by two
	 * elements : a panel and its associated tab
	 */

	this.skwitem = skwitem;

	this.isMixed = (function(that) {
		var bookmark = that.skwitem.bookmark;
		/*
		 * A folder is said to be mixed if it contains both subfolders and
		 * links. This results in an extra "root" tab having the same label as
		 * its parent
		 */
		var i = 0, z = 0;
		for (i = 0; i < bookmark.children.length; i++)
			z += (bookmark.children[i].url ? 1 : 2);
		return ((z % i) != 0);
	})(this);

	this.plantInDOM = function(aSkwolder) {
		var parentId = aSkwolder.bookmark.parentId;
		var bmId = aSkwolder.bookmark.id;

		var locus;
		if (!parentId) {
			locus = $('#mainSkware');
			locus.text('');
		} else {
			locus = $('#panel' + parentId);
		}

		// create a panel for this folder
		var panel = $(document.createElement('div'));
		panel.attr('id', 'panel' + bmId);
		panel.addClass('panel');
		locus.append(panel);

		//keep reference to back-end bookmark
		panel.get(0).bookmark = aSkwolder.bookmark ;
		
		// remember
		skwares.panels.push(panel);

		// create an entry in the parent's tab bar
		if (parentId) {
			var tabbar = $('#tabbar' + parentId);
			// if not there yet, create it
			if (tabbar.length === 0) {
				tabbar = $(document.createElement('ul'));
				tabbar.attr('id', 'tabbar' + parentId);
				var parentPanel = $('#panel' + parentId);
				parentPanel.prepend(tabbar);
			}
			var tab = $(document.createElement('li'));
			tab.addClass('tab');
			tabbar.append(tab);
			tab.get(0).bookmark = aSkwolder.bookmark ;
			var a = $(document.createElement('a'));
			a.attr('href', '#panel' + bmId);
			a.text(aSkwolder.bookmark.title);
			tab.append(a);
		}

		if (this.isMixed) {
			// the panel will remember
			panel.get(0).isMixedPanel = true;
			
			// make sure the kids remember where they belong
			aSkwolder.bookmark.children.forEach(function(kid) {
				kid.hasMixedParent = true;
			});

			// append a nested panel to the one we've just created;
			var subPanel = $(document.createElement('div'));
			subPanel.attr('id', 'panel' + bmId + '_top');
			subPanel.addClass('panel');
			panel.append(subPanel);
			// remember
			skwares.panels.push(subPanel);

			// create an entry in the panel's tab bar
			var tabbar = $('#tabbar' + bmId);
			// if not there yet, create it
			if (tabbar.length === 0) {
				tabbar = $(document.createElement('ul'));
				tabbar.attr('id', 'tabbar' + bmId);
				panel.prepend(tabbar);
			}
			var tab = $(document.createElement('li'));
			tab.addClass('tab');
			tabbar.append(tab);
			tab.get(0).bookmark = aSkwolder.bookmark ;
			var a = $(document.createElement('a'));
			a.attr('href', '#panel' + bmId + '_top');
			a.text(aSkwolder.bookmark.title);
			tab.append(a);
		}
	};

};

var Skware = function(skwitem) {

	this.switem = skwitem;

	this.plantInDOM = function() {
		var bmId = skwitem.bookmark.id;
		var a = $(document.createElement('a'));
		a.attr('id', 'sk' + bmId).attr('href', skwitem.bookmark.url).attr(
				'target', Math.random()).addClass('skware');

		var icon = $(document.createElement('img'));
		icon.attr('src', 'chrome://favicon/' + skwitem.bookmark.url);
		icon.addClass('skicon');
		a.append(icon);

		var title = $(document.createElement('div'));
		title.text(skwitem.bookmark.title).addClass('sk-title');
		a.append(title);
		
		//use the domain part of the url as the tooltip
		//"anything that's between the intial // and the first /"
		var re = /.*?\/\/(.*?)\/.*$/;
		var res = skwitem.bookmark.url.replace(re,'$1');
		a.attr('title',res);

		var sfx = skwitem.bookmark.hasMixedParent ? '_top' : '';
		var panel = $('#panel' + skwitem.bookmark.parentId + sfx);
		panel.append(a);
		
		//Taking advantage of the classless and prototypal nature of
		//JavaScript, we attach the chrome.bookmarks node to the DOM element
		//for ulterior reference such as edit, delete et al.
		a.get(0).bookmark = skwitem.bookmark;
	};
}

//.............................................................................
//The Nexus
//.............................................................................
var climbTheTree = function(nodes) {
	nodes.forEach(function(node) {

		var skwitem = new Skwitem(node);

		if (node.children) {
			climbTheTree(node.children)
		}
	});
};
//.............................................................................

/*
 * ============================================================================
 * ===== S T A R T =========================================================
 * ============================================================================
 */
$(document).ready( function() {

	// Get to the tree of bookmarks, and start climbing
	chrome.bookmarks.getTree(function(stem) {
		/*
		 * getTree yields an array of one lone element, which is
		 * the stem of the bookmarks tree 🎄.
		 */

		climbTheTree(stem);

		// jQuerify all the things
		skwares.panels.forEach(function(panel) {
			panel.tabs();
		})

		/* Wait for the database to come up and adjust the positions of those 
		 * of the skwares that were moved
		 */
		ωρ.addEventListener('success',function(){
			var transaction = δβ.transaction(["skwarePos"]);
			var store = transaction.objectStore("skwarePos");
			var readReq = store.getAll();
			readReq.onerror = function(){
				console.log('erred while reading all',readReq);
			};
			readReq.onsuccess=function(){ 
				readReq.result.forEach(function(pos){
					var skware = $('#' + pos['id']);
					skware.css( 'top',	pos['top'] );
					skware.css( 'left',	pos['left'] );
				});
			}			
		});
		
		
		/*
		 * =========================================================================
		 * ..... Drag & Drop ..... Context menus
		 * =========================================================================
		 */

		// We're still inside the response to getTree, and this due to the
		// asynchronous nature of chrome.bookmarks methods
		
		// Make the skwares draggable, and the tabs droppable
		var dragstart = function(event, ui) {
			// skware be semi-transparent while dragged
			var color = $(ui.helper[0]).css('background-color');
			skwares.colorBefore = color;
			// explode the "rgb(r,g,b)" string to a [r,g,b] array
			color = color.replace('rgb(', '').replace(')', '')
			.split(',').map(function(z) {
				return z.trim()
			});
			if (color.length == 4)
				color.pop(); // already transparent ?
			color.push(0.5);
			color = 'rgba(' + color.join(',') + ')';
			$(ui.helper[0]).css({
				'background-color' : color
			})
		}

		var dragstop = function(event, ui) {
			var subject = ui.helper[0];
			$(subject).css({
				'background-color' : skwares.colorBefore
			});
			delete skwares.colorBefore;

			if ( ! subject.isOverATab) {
				// was displaced inside a panel,
				var id =	subject.id;
				var top =	subject.style.top;
				var left =	subject.style.left;
				
				// store new position
				put(id,top,left);
			}

			subject.isOverATab = false; // if it was, it's just
			// been dropped
		}

		$('.skware').draggable({
			containment : 'document',
			cursor : 'move',
			snap : 'tab',
			start : dragstart,
			stop : dragstop
		});

		/*
		 * What happens when a skware is dropped on a tab is
		 * defined here. Two things : 1. the skware is adopted
		 * by the tab's parent 2. the move is effected in the
		 * browser.bookmarks tree
		 */

		var theDrop = function(event, ui) {
			// 1.
			console.log('event target is', event.target);

			var targetFolderId = event.target.bookmark.id;
			var targetPanelId = 'panel' + targetFolderId;

			var targetPanel = document.getElementById(targetPanelId);
			if (targetPanel.isMixedPanel) {
				targetPanelId += '_top';
			}

			skware = $(ui.helper[0]);
			$('#' + targetPanelId).append(skware);

			console.log(skware.attr('id'), 'was dropped on',
					targetPanelId);

			skware.removeClass('dropme');
			
			// delete the stored position, if any
			suppr(skware.attr('id'));
			
			/*
			 * The two following lines are super important but
			 * I've no idea how exactly they work. After the
			 * drop, the skware gets an outlandish position, I
			 * found no other way to contol it
			 */
			skware.css('top', 'auto');
			skware.css('left', 'auto');
			
			// 2.
			chrome.bookmarks.move(skware.get(0).bookmark.id, {
				'parentId' : targetFolderId
			});
		}

		// Make the tabs droppable
		$('.tab').droppable({
			accept : '.skware',
			tolerance : 'pointer',
			drop : theDrop,
			over : function(event, ui) {
				$(ui.helper[0]).addClass('dropme');
				ui.helper[0].isOverATab = true; // prepare to
				// jump tabs
			},
			out : function(event, ui) {
				$(ui.helper[0]).removeClass('dropme');
				ui.helper[0].isOverATab = false; // nah,
				// staying
				// there
				// finally
			},
			hoverClass : 'dz-hover'
		});

	}); // Done building the tabs and all

	/* =========================================================================
	 * 	Context menus : edit or delete the skware with rigth-click
	 * =========================================================================
	 */

	var cm_edit = function(element) {
		/*
		 * Get the title of the clicked skware and prefill the edit
		 * dialog We also store the clicked skware in a global variable
		 * so that we'll be able to get back to it after validating the
		 * edit box
		 */
		if ($(element[0]).hasClass('skware')) {
			skwares.hotTopic = element[0];
		} else { // click was on the title div or the icon
			skwares.hotTopic = $(element[0]).parent().get(0);
		}

		// get the title div by its class
		title = $(skwares.hotTopic).find('.sk-title').html();
		$('#dlg-title').val(title); // prefill the dialog, at last.

		$('#dlg-edit').resizable().dialog('open') // now we can talk.
	}

	var cm_delete = function(element) {
		if ($(element[0]).hasClass('skware')) {
			skwares.hotTopic = element[0];
		} else { // click was on the title div or the icon
			skwares.hotTopic = $(element[0]).parent().get(0);
		}
		$('#dlg-confirm-del').dialog('open');
	}

	$(document).contextmenu({
		delegate : ".skware",
		menu : [ {
			title : "Edit",
			cmd : "cm_edit",
			uiIcon : ""
		}, {
			title : "Delete",
			cmd : "cm_delete"
		}, ],
		select : function(event, ui) {
			if (ui.cmd === 'cm_edit') {
				cm_edit(ui.target);
			} else if (ui.cmd === 'cm_delete') {
				cm_delete(ui.target);
			} else {

			}
		}
	});

	$('#dlg-confirm-del').dialog({
		autoOpen : false,
		modal : true,
		buttons : [ {
			text : 'OK',
			click : function() {
				var bookmarkId = skwares.hotTopic.bookmark.id;
				$(skwares.hotTopic).remove();
				delete skwares.hotTopic;
				$(this).dialog('close')

				// back-end deletion
				chrome.bookmarks.remove(bookmarkId, function() {
					// delete stored position if any
					suppr('sk'+bookmarkId);
					// Some day, provision for undelete will start here
				})
			}
		}, {
			text : 'Cancel',
			click : function() {
				$(this).dialog('close')
			}
		} ]
	});

	$('#dlg-edit').dialog(
			{
				autoOpen : false,
				width : 600,
				dialogClass : 'modalform',
				modal : true,
				buttons : [
				           {
				        	   text : 'OK',
				        	   click : function() {
				        		   // get back to the skware we singled out
				        		   // earlier
				        		   title = $(skwares.hotTopic)
				        		   .find('.sk-title');
				        		   strTitle = $('#dlg-title').val();
				        		   title.html($('#dlg-title').val());
				        		   $('#dlg-title').val('');

				        		   $(this).dialog('close');

				        		   // send that shit back-end
				        		   bookmarkId = skwares.hotTopic.bookmark.id;
				        		   chrome.bookmarks.update(bookmarkId, {
				        			   title : strTitle
				        		   });

				        		   // be clean, don't leave dandling
				        		   // globals
				        		   delete skwares.hotTopic;
				        	   }
				           }, {
				        	   text : 'Cancel',
				        	   click : function() {
				        		   $(this).dialog('close');
				        		   delete skwares.hotTopic;
				        	   }
				           } ]
			})

			// end of Drag & Drop , context menu =======================================

}); // end of $(document).ready()