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
			var queryLowest = function(node, from) {
				if (from < node.value.from()) {
					if (node.leftChild) {
						return queryLowest(node.leftChild, from);
					}
				}
				return node;
			};

			var queryHighest = function(node, to) {
				if (to < node.value.to()) {
					if (node.leftChild) {
						return queryHighest(node.leftChild, to);
					}
				}
				else if (to > node.value.to()) {
					if (node.rightChild) {
						return queryHighest(node.rightChild, to);
					}
				}
				return node;
			}

			if (node) {
				console.log(queryLowest(node, from));
				console.log(queryHighest(node, to));
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

		return _Range;
	})();

	var win = window;

	var FastList = (function() {
		var _FastList = function(el) {
				this._init(el);			
			},
			documentOffsetTop = function(el) {
				var top = 0,
					current = el;
				while (current) {
					top += current.offsetTop;
					current = current.offsetParent;
				}
				return top;
			};

		_FastList.prototype._init = function(el){			
			this._el = el;

			var index = new RangeTree(),
				parentTop = el.offsetParent == el.ownerDocument.documentElement
							|| el.offsetParent == el.ownerDocument.body
							? 0
							: documentOffsetTop(el);

			var n = el.firstChild;
			while (n) {
				var top = parentTop + n.offsetTop;
				index.insert(new Range(top, top + n.offsetHeight, n));	
				n = n.nextSibling;
			}
			this._index = index;

			console.log(index);

			var results = this._index.query(0, 500, function(node) {
				console.log(node);
			});
		};

		return _FastList;
	})();

	if (!win.OK)
		win.OK = {};

	win.OK.FastList = FastList;
	win.OK.RangeTree = RangeTree;
	win.OK.Range = Range;
})();