(function() {
	"use strict";

	var RangeTree = (function() {
		var
			COLOR_RED = 1,
			COLOR_BLACK = 2;


		var TreeNode = function(value, parent, color) {
				this.value = value;
				this.parent = parent;
				this.color = color;
				this.leftChild = null;
				this.rightChild = null;					
			};

		var _RangeTree = function() {
			this._init();
		};

		_RangeTree.prototype._init = function() {
			this._root = null;
		};

		_RangeTree.prototype._insertInternal = function(node, range) {
			var value = range.from(),
				parentValue = node.value.from(),
				n;
			if (value < parentValue) {
				if (node.leftChild) {					
					n = this._insertInternal(node.leftChild, range);					
				}
				else {
					n = new TreeNode(range, node, COLOR_RED);
					n.max = range.to();
					node.leftChild = n;
				}
			}
			else {
				if (node.rightChild) {
					n = this._insertInternal(node.rightChild, range);					
				}
				else {
					n = new TreeNode(range, node, COLOR_RED);
					n.max = range.to();
					node.rightChild = n;
				}
			}

			this._rebalance(n);			

			return n;
		};

		_RangeTree.prototype._updateMax = function(tree) {
			if (tree) {
				tree.max = Math.max(tree.value.to(),
					tree.leftChild ? tree.leftChild.max : -1,
					tree.rightChild ? tree.rightChild.max : -1);
				this._updateMax(tree.parent);			
			}
		},

		_RangeTree.prototype._rotateLeft = function(x) {
			var y = x.rightChild;

			x.rightChild = y.leftChild;
			if (y.leftChild) y.leftChild.parent = x;

			if (y) {
				y.parent = x.parent;
			}

			if (x.parent) {
				if (x == x.parent.leftChild) {
					x.parent.leftChild = y;
				}
				else  {
					x.parent.rightChild = y;
				}					
			}
			else {
				this._root = y;
			}

			y.leftChild = x;
			if (x) {
				x.parent = y;
			}				
		};

		_RangeTree.prototype._rotateRight = function(x) {
			var y = x.leftChild;

			x.leftChild = y.rightChild;
			if (y.rightChild) {
				y.rightChild.parent = x;
			}

			if (y) {
				y.parent = x.parent;
			}
			if (x.parent) {
				if (x == x.parent.rightChild) {
					x.parent.rightChild = y;
				}
				else {
					x.parent.leftChild = y;
				}
			}
			else {
				this._root = y;
			}

			y.leftChild = x;
			if (x) {
				x.parent = y;
			}
		};

		_RangeTree.prototype._rebalance = function(x) {
			//code ported to JS from the C code from
			//http://www.cs.auckland.ac.nz/~jmor159/PLDS210/niemann/s_rbt.txt
			while (x != this._root && x.parent.color == COLOR_RED) {
				if (x.parent == x.parent.parent.leftChild) {
					var y = x.parent.parent.rightChild;
					if (y.color == COLOR_RED) {
						x.parent.color = COLOR_BLACK;
						y.color = COLOR_BLACK;
						x.parent.parent.color = COLOR_RED;
						x = x.parent.parent;
					}
					else {
						if (x == x.parent.rightChild) {
							x = x.parent;
						}

						x.parent.color = COLOR_BLACK;
						x.parent.parent.color = COLOR_RED;
						this._rotateRight(x.parent.parent);						
					}
					this._updateMax(y);
				}
				else {
					var y = x.parent.parent.leftChild;
					if (y && y.color == COLOR_RED) {
						x.parent.color = COLOR_BLACK;
						y.color = COLOR_BLACK;
						x.parent.parent.color = COLOR_RED;
						x = x.parent.parent;
					}
					else {
						if (x == x.parent.leftChild) {
							x = x.parent;
							this._rotateRight(x);
						}
						x.parent.color = COLOR_BLACK;
						x.parent.parent.color = COLOR_RED;
						this._rotateLeft(x.parent.parent);						
					}
					this._updateMax(y);
				}
				this._updateMax(x);
			}
			this._root.color = COLOR_BLACK;
		};

		_RangeTree.prototype._queryInternal = function(node, from, to, callback) {
			if (!node)
				return;

			if (from > node.max)
				return;

			if (node.leftChild) {
				this._queryInternal(node.leftChild, from, to, callback);
			}

			if (node.value.overlapsWith(from, to)) {
				callback(node);
			}

			if (to < node.value.from()) {
				return;
			}

			if (node.rightChild) {
				this._queryInternal(node.rightChild, from, to, callback);
			}				
		};

		_RangeTree.prototype.insert = function(range) {
			var value = range.from();
			if (this._root == null)	{
				var n = new TreeNode(range, null, COLOR_BLACK);
				n.max = range.to();
				this._root = n;
				return n;
			}
			else {
				return this._insertInternal(this._root, range);
			}
		};		

		_RangeTree.prototype.query = function(from, to, callback) {
			this._queryInternal(this._root, from, to, callback);
		};

		return _RangeTree;
	})();

	var Range = (function(){
		var _Range = function(from, to, el) {
			this._init(from, to, el);
		};

		_Range.prototype._init = function(from, to, el) {
			this._from = from;
			this._to = to;
			this.el = el;
		};

		_Range.prototype.from = function() {
			return this._from;
		};

		_Range.prototype.to = function() {
			return this._to;
		};

		_Range.prototype.overlapsWith = function(otherFrom, otherTo) {
			var from = this._from,
				to = this._to;
			return from <= otherTo			
				&& to >= otherFrom;
		};

		return _Range;
	})();

	var win = window,
		doc = win.document;

	var SCROLL_TIMEOUT = 50;

	var FastList = (function() {
		var _FastList = function(el, options) {
				this._init(el, options);			
			},
			documentOffsetTop = function(el) {
				var top = 0,
					current = el;
				while (current) {
					top += current.offsetTop;
					current = current.offsetParent;
				}
				return top;
			},

			currentViewport = function() {
				var start = win.pageYOffset,
					height = doc.documentElement.clientHeight;
				return [ start, start + height ];
			},

			findViewportElement = function(el) { 
				return win;
			},

			elementInterval = function(n) {
				var top = n.offsetTop;
				return [top, top + n.offsetHeight];
			},

			bind = function(fn, thisArg) {
				return function() {
					return fn.apply(thisArg, arguments);
				};
			};

		_FastList.prototype._init = function(el, options){			
			this._el = el;
			this._handlers = {};

			var head = doc.createElement('div');
			head.setAttribute('class', 'fl-placeholder fl-head');
			el.insertBefore(head, el.firstChild);
			this._head = head;

			var tail = doc.createElement('div');
			tail.setAttribute('class', 'fl-placeholder fl-tail');
			el.appendChild(tail);
			this._tail = tail;

			this._options = options;
			if (this._enabled('initialReload')) {
				this.reload();
			}

			var scroll = findViewportElement(el),
				scrollTimeout;
			scroll.addEventListener('scroll', bind(function() {
				if (scrollTimeout) {
					win.clearTimeout(scrollTimeout);
				}
				scrollTimeout = win.setTimeout(bind(function(){
					var viewport = currentViewport();
					if (viewport[1] > this._upperBound - viewport[1] + viewport[0]) {
						this._fire('edge', viewport);
					}

					this._reloadViewport(viewport);
				}, this), SCROLL_TIMEOUT);				
			}, this), false);
			this._scroll = scroll;

		};

		_FastList.prototype._enabled = function(name) {
			var options = this._options;
			return options && options[name];
		};

		_FastList.prototype._reinitIndex = function() {
			var el = this._el,
				index = new RangeTree(),
				parentTop = el.offsetParent == el.ownerDocument.documentElement
							|| el.offsetParent == el.ownerDocument.body
							? 0
							: documentOffsetTop(el);						

			var n = el.firstChild,
				tail = this._tail,
				head = this._head,
				min = -1,
				max = -1;

			while (n) {
				if (n != head && n != tail) {
					var interval = elementInterval(n),
						top = parentTop + interval[0],
						bottom = parentTop + interval[1];
					min = min > 0 ? Math.min(min, top) : top;
					max = max > 0 ? Math.max(max, bottom) : bottom;
					index.insert(new Range(top, bottom, n));	
				}
				n = n.nextSibling;
			}
			this._lowerBound = min;
			this._upperBound = max;
			this._index = index;
		};

		_FastList.prototype._fire = function(eventName) {
			if (this._handlers[eventName]) {
				var handlers = this._handlers[eventName],
					len = handlers.length;				
				for (var i = 0; i < len; i++) {
					handlers[i].apply(this, arguments);
				}
			}
		}

		_FastList.prototype._reloadViewport = function(viewport) {
			var timingStart = new Date().getTime();

			var index = this._index,
				elems = [],
				before = [],
				after = [],
				first, last;

			var height = viewport[1] - viewport[0],
				viewportLower = Math.max(this._lowerBound, viewport[0] - height),
				viewportUpper = Math.min(this._upperBound, viewport[1] + height);

			var listElem = this._el,
				headHeight = 0,
				tailHeight = 0;

			listElem.removeChild(this._head);
			listElem.removeChild(this._tail);
			listElem.innerHTML = '';

			listElem.appendChild(this._head);

			index.query(viewportLower, viewportUpper, function(node) {				
				var range = node.value,
					el = range.el;

				if (!first) {
					first = range;
				}

				last = range;

				listElem.appendChild(el);
			});

			listElem.appendChild(this._tail);

			this._head.style.height = first.from() - this._lowerBound + 'px';
			this._tail.style.height = this._upperBound - last.to() + 'px';		

			var timingEnd = new Date().getTime();
			console.log('Viewport has been refreshed in ' + (timingEnd - timingStart) + 'ms');
		};

		_FastList.prototype.append = function(items) {

			if (typeof items == 'string') {
				var fragment = doc.createDocumentFragment(),
					container = doc.createElement('div');
				fragment.appendChild(container);
				container.innerHTML = items;
				items = [];
				var n = container.firstChild
				while (n) {
					items.push(n);
					n = n.nextSibling;
				}
			}
			
			var listElem = this._el,
				len = items.length,
				index = this._index,
				parentTop = listElem.offsetParent == listElem.ownerDocument.documentElement
							|| listElem.offsetParent == listElem.ownerDocument.body
							? 0
							: documentOffsetTop(listElem);

			var len = items.length;
			for (var i = 0; i < len; i++) {
				var item = items[i];
				listElem.appendChild(item);
				var interval = elementInterval(item);

				var top = parentTop + interval[0],
					bottom = parentTop + interval[1];
				this._upperBound = Math.max(this._upperBound, bottom)
				index.insert(new Range(top, bottom, item));	
			}

			this._reloadViewport(currentViewport());
		};

		_FastList.prototype.on = function(eventName, handler) {
			if (!this._handlers[eventName]) {
				this._handlers[eventName] = [];
			}
			this._handlers[eventName].push(handler);
		};

		_FastList.prototype.reload = function() {
			this._reinitIndex();
			this._reloadViewport(currentViewport());
		};

		return _FastList;
	})();

	if (!win.OK)
		win.OK = {};

	win.OK.FastList = FastList;
	win.OK.RangeTree = RangeTree;
	win.OK.Range = Range;
})();