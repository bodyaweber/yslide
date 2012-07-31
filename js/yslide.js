(function($){
	function ySlideFullscreen (opts) { 
		var self = this;

		var defaults = {
			id : "ySlideFullscreen",
			onNextClick: null,
			onPrevClick: null,
			onPlayClick: null,
			onExitClick: null
		}

		if (opts) {
			self.opts = $.extend (defaults, opts) 
		} else {
			self.opts =defaults;
		}

		var el = _create();
		_initCallbacks ();
		_initControls ();

		var scrollTop = 0;

// Private 
		function _create () {
			var el = 0;
			if ((el = $(self.opts.id)).length) return el;						
			el = $("<div class='yslide-fullscreen' id='"+self.opts.id+"'></div>").prependTo ("body");								                                                
			var container = $("<div class='yslide-fullscreen-container'></div>").appendTo (el);
			$("<div id='ySlideContent'></div>").appendTo (container);   // content 
			var control = $("<div class='yslide-control-container'></div>").appendTo (container); // control container
			control = $("<div id='ySlideControl'></div>").appendTo (control);

			// Creating buttons
			$("<div class='yslide-button' id='ySlidePrev'>Back</div>").appendTo (control);
			$("<div class='yslide-button' id='ySlideNext'>Next</div>").appendTo (control);
			$("<div class='yslide-button' id='ySlidePlay'>Play</div>").appendTo (control);
			$("<div class='yslide-button' id='ySlideExit'>Exit</div>").appendTo (control);
			$("<div style='clear:both'></div>").appendTo (control);

			return el;
		}

		function _initCallbacks () {		
			$.each (el.find(".yslide-button"), function () {
				var func = "on"+$(this).attr("id").replace("ySlide","")+"Click";
				if (func != "onClick") {
					$(this).click ( function (ev) {
						if (typeof self.opts[func] =="function" ) self.opts[func](ev);					
					} );
				}
			});
			$("#ySlideExit").click ( function () { _exit(false); } );
		}
		
		function _initControls () {
			var control = $("#ySlideControl");

/* Several ySlide elements using same fullscreen controls,
   we should prevent additional init calls
*/
			if (!control.length || control.attr("data-ySlideInit") == "1" ) return; 
			control.parent().hover (
				function () { control.slideDown ("fast"); }, 
				function () { control.slideUp ("slow"); }
			);

			$(document).keydown ( function (ev) {
				if (el.css("display") =="none") return;	

				if (ev.keyCode && ev.keyCode == 27) _exit(true);  // Esc
				if (ev.keyCode && ev.keyCode == 37 && typeof self.opts.onPrevClick == "function") self.opts.onPrevClick ();  //Left
				if (ev.keyCode && (ev.keyCode == 39 || ev.keyCode == 32) && typeof self.opts.onNextClick == "function") { 
					self.opts.onNextClick (); //SpaceBar, Right
					ev.preventDefault ();   // To prevent pagescroll on spacebar in FF
					return false;
				}
			} );

			control.attr("data-ySlideInit", "1");
		}

		function _exit (callback) {
			self.hide ();
			if (callback && typeof self.opts.onExitClick == "function" ) self.opts.onExitClick ();
		}

// Public
		self.show = function () {
			scrollTop = $(window).scrollTop();
			el.css ( { height: $(document).height() } );
			el.fadeIn ("slow", function () {
				$(window).scrollTop(0);
				$("#ySlideContent").focus();
			});//show ();

			//removing scrollbars from window
			$(document).css({overflow:"hidden"});
			$("body").css({overflow:"hidden"});
		}
		
		self.hide = function () {
			//returning window state
			$(document).css({overflow:""});
			$("body").css({overflow:""});
			$(window).scrollTop (scrollTop);

			el.fadeOut ("slow");	
		}

		self.setContent = function (content) {
			$("#ySlideContent").hide ();
			$("#ySlideContent").html (content);
			$("#ySlideContent").fadeIn ("slow");			
		}

		self.setSlideshow = function (enable) {
			if (enable) $("#ySlidePlay").addClass ("pressed");
			else $("#ySlidePlay").removeClass ("pressed");
		}

		return self;
	}	

	function ySlide (id, opts) {
		var defaults = {
			slideClassName : "slide",
			menu : "nav",
			slideDelay : 5000			
		}

		var self = this;
		var el = $(id);
		var fullscreen = 0;
		var slideCurrent = 0;
		var interval = 0;
		var inprocess = false;

		if (opts) {
			self.opts = $.extend (defaults, opts) 
		} else {
			self.opts =defaults;
		}

		if (!id || !el.length) {
			_clog ("Element not found");
			return null;
		}		

		self.slides = el.find ("."+self.opts.slideClassName);

		if (!self.slides.length) {
			_clog ("Slides not found");
			return null;
		}		


// Private		
	// Init				   
		function _initNav () {
			var content = "";
			var text = "<a href='#slide%id%'><div>%name%</div></a>";
			$.each (self.slides, function (i,item) {
				var name = "";
				if (!(name = $(item).attr("data-ySlideName")) ) name = "Слайд "+i;
				content +=text.replace ("%id%",i).replace ("%name%", name);			
				$(item).prepend ("<a name='slide"+i+"'></a>");
			} );

			if (!$(self.opts.menu).length) return;
			$(self.opts.menu).html (content);
		}
		
		function _initFullscreen () {
			fullscreen = new ySlideFullscreen ( {
				onPlayClick : self.playPause,
				onExitClick : _onExit,
				onNextClick : self.next,
				onPrevClick : self.prev
			} ); 
		}

	// Utils
		function _clog (message) {	
			console.log ("ySlide: " + message );
		}

		function _parseLink () {
			var hash = window.location.hash;
			var r = /#slide\d+/gi;
			if (!r.test (hash) ) return false;		
			return parseInt(hash.match (/\d+/gi)[0]);					
		}

	// Controls
		function _prev () {
			if (slideCurrent == 0) return;
			slideCurrent --;
			fullscreen.setContent (self.slides[slideCurrent].innerHTML );
		}

		function _next () {
			slideCurrent ++;
			if ( slideCurrent > self.slides.length ) {  
				slideCurrent = self.slides.length;
				return;
			}
			window.location.hash = "#slide"+slideCurrent;
			$(window).scrollTop (0);

			if ( slideCurrent == self.slides.length ) {
				self.stop ();
				fullscreen.setContent ("Конец презентации.<br/>Используйте меню сверху экрана для выхода или переключения слайдов");
				return;
			}
			fullscreen.setContent (self.slides[slideCurrent].innerHTML );
		}

		function _start (slideshow) {
			fullscreen.show();
			_saveSettings ("fullscreen", "1");
			_next ();
			if (slideshow) {
				fullscreen.setSlideshow (true);
				inprocess = true;
				interval = setInterval ( function () { if (inprocess) _next() } , self.opts.slideDelay);																			
			}
		}

		function _onExit () {
			_saveSettings ("fullscreen", "0");
			self.stop();
		}

	// Settings 
		function _saveSettings (option, value) {
			if (typeof(localStorage) == "undefined" ) return;
			try {
				localStorage.setItem("ySlide-"+option, value); 
			}
			catch (e) {}
		}

		function _getSettings (option) {
			if (typeof(localStorage) == "undefined" ) return;
			return localStorage.getItem("ySlide-"+option);
		}

// Public
		self.start = function () {
			slideCurrent = -1;
			_start (true);						
		}		

		self.playPause = function () {
			if (inprocess) {
				self.stop();
				return;
			}			
			if (slideCurrent >=self.slides.length) slideCurrent = 0;
			slideCurrent--; // Need to show current slide
			_start (true);
		}
		
		self.stop = function () {
			fullscreen.setSlideshow (false);
			clearInterval ( interval );
			interval = 0;			
			inprocess = false;
		}
		self.next = function () {
			if (inprocess) self.stop();
			_next ();
		}

		self.prev = function () {
			if (inprocess) self.stop();
			_prev ();
		}

		self.continue = function () {
			var current = _parseLink ();
			if (current === false || current <0 || current > self.slides.length) current = 0;
			slideCurrent = current -1;
			_start (true);
		}

		self.show = function () {
			slideCurrent = -1;
			_start (false);
		}

		self.hide = function () {
			self.stop();
			fullscreen.hide();
		}

		_initNav();
		_initFullscreen ();

		var current = _parseLink ();
		if (current !==false && current>=0 && current <self.slides.length) {
			slideCurrent = current;         	
			$(window).scrollTop ($(self.slides[slideCurrent]).position().top); // Scroll to current on window reload
			if (_getSettings ("fullscreen") == "1") {
				slideCurrent --;
				_start (false);
			}		
		}
	}

	$.ySlide=function (id, opts) {
		return new ySlide (id,opts);
	}
})(jQuery);
