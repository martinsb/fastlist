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
					node.max = Math.max(range.to(), node.leftChild.max, node.rightChild ? node.rightChild.max : -1);
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
					node.max = Math.max(range.to(), node.leftChild ? node.leftChild.max : -1, node.rightChild.max);
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
							this._rotateLeft(x);
						}

						x.parent.color = COLOR_BLACK;
						x.parent.parent.color = COLOR_RED;
						this._rotateRight(x.parent.parent);
					}
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
				}
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
				if (to > node.max) {
					if (node.rightChild) {
						return queryHighest(node.rightChild, to)
					}
				}
				else {
					if (node.leftChild) {
						return queryHighest(node.leftChild, to);
					}
				}
				return node;
			}

			if (node) {
				console.log(queryLowest(node, from));
				console.log(queryHighest(node, to));
			}
			// if (node) {
			// 	var nodeFrom = node.value.from(),
			// 		max = node.max;

			// 	if (nodeFrom >= from && node.value.to() <= to) {
			// 		results.push(node.value.el);
			// 	}

			// 	if (from < nodeFrom) {
			// 		this._queryInternal(node.leftChild, from, to, results);

			// 	}
			// 	else {
			// 		this._queryInternal(node.rightChild, from, to, results);
			// 	}
			// }
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
		var FL = function(el) {
			this._init(el);			
		};

		FL.prototype._init = function(el){			
			this._el = el;

			var index = new RangeTree();

			var n = el.firstChild;
			while (n) {
				var bounds = n.getBoundingClientRect();
				index.insert(new Range(bounds.top, bounds.top + bounds.height, n));	
				n = n.nextSibling;
			}
			this._index = index;

			var results = this._index.query(0, 500, function(node) {
				console.log(node);
			});
		};

		return FL;
	})();

	if (!win.OK)
		win.OK = {};

	win.OK.FastList = FastList;
	win.OK.RangeTree = RangeTree;
	win.OK.Range = Range;
})();