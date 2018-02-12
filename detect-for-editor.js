

(function(factory,window){
    window.onload = factory(window);
})(function(window){

    var isIe,
        sel,
        isShiftKey,
        body=document.body;
    var canCmd = document.documentMode ? document.documentMode < 11 : true; //判断是否是ie11（？ie11不能使用document.execCommand('insertHTML'),range的函数也无效）
    var isIe = document.selection;          //判断是否是ie或版本低于11
    var keyToCode = {'@':50,'#':51};        //可能要检测的符号的键盘值

    function detectKeyword(el,keyWord){
        if(!el)return {};
        this.keyWord = keyWord || '@';
        this.el = window.jQuery && el instanceof window.jQuery ? el[0] : el;
        this.sel = isIe ?  document.selection : window.getSelection();
        this.range;
        this.box = document.createElement('div');
        this.box.id = this.el.id + '-box';
        this.curAtIndex = this.at_index = 0; 
        this.init();
    }

    //初始化编辑器的输入监听事件
    detectKeyword.prototype.init = function(){
        var that = this;
        this.el.onkeydown = this.inputListen.bind(this);
        this.el.onmouseup = function(e){
            that.checkBeforePointNode();
        }
        body.onclick = function(e){
            //如果被点击的元素不在编辑器的范围内，则隐藏提示框
            if(!hasBox(e.target,that.el)){
                hasBox(that.box) && hideBox(that.box);
            }
            e.preventDefault();
            e.stopPropagation();
            return;
        }
    }

    detectKeyword.prototype.inputListen = function(event){
        var range = this.range;
        var code = event.keyCode || event.which;
        //用于监听空格按键的事件。当光标所在的元素是具有class为'at_span'的，则跳出该元素。
        if( code == 32){
            var shouldCmd = this.checkBeforePointNode(false);
            if(shouldCmd){
                canCmd ? isIe ? this.outSideEleForlessIe11('&nbsp;','span') :  document.execCommand("insertHTML", false,"<span>&nbsp;</span>") : this.insertHtml("<span>&nbsp;</span>");
                event.preventDefault();
            }
        }
        //监听删除键。当光标前的元素是具有class为'at_span'的，则显示提示框
        if( code == 8){
            this.checkBeforePointNode();
        }
        //监听关键字，如输入关键字，则插入具有class为'at_span'的span元素，并生成提示框
        if( code == keyToCode[this.keyWord]  &&  event.shiftKey){
            this.range = range = isIe ? this.sel.createRange() : this.sel.getRangeAt(0).cloneRange();
            this.beforecreateSpan(this.box,this.el,this.range);
            if(isIe){   //少于ie11
                this.insertHTMLForLess11("&nbsp;<span id='at"+this.at_index+"' class='at_span'>"+this.keyWord+"</span>");
            }else{
                if(canCmd){ //非ie
                    document.execCommand("insertHTML", false,"&nbsp;<span id='at"+this.at_index+"' class='at_span'>@</span>");
                }else{  //ie11，但并没有完成这个函数逻辑
                    this.insertHtml("&nbsp;<span id='at"+this.at_index+"' class='at_span'>@</span>");
                }
            }
            this.curAtIndex = this.at_index++;
            createBox(this.box,this.curAtIndex);
            event.preventDefault();
        }
    }

    //低于ie11的ie版本跳出某个元素的方法
    detectKeyword.prototype.outSideEleForlessIe11 = function(text,tagName){
        if(!tagName)return;
        var beforeCon = this.getBeforeCons();
        var endTag = '</'+tagName+'>';
        var elHtml = this.el.innerHTML;
        var bcLen = beforeCon.length;
        var afterCon = elHtml.slice(bcLen+1);
        var endTagIndex = afterCon.indexOf(endTag);
        afterCon = afterCon.slice(0,endTagIndex) + afterCon.slice(endTagIndex+endTag.length);
        beforeCon += endTag+text;
        this.el.innerHTML = beforeCon + afterCon;
        this.el.focus();
    }

    //低于ie11的ie版本生成具有class为'at_span'的span元素的方法
    detectKeyword.prototype.insertHTMLForLess11 = function(text,isOut){
        if(typeof text !== 'string')return;
        var range = this.range;
        range.pasteHTML(text);
        var cons = this.getBeforeCons();
        tlen = cons.length;
        atLen = isOut ? tlen : cons.lastIndexOf(this.keyWord);
        range.collapse(true);
        range.moveEnd('character',atLen);
        range.moveStart('character',atLen);
        range.select();
        this.el.focus();
    }

    //ie11的生成具有class为'at_span'的span元素的方法（未完成）
    detectKeyword.prototype.insertHtml = function(html){
        var range = this.range;
        var beforeCon = this.getBeforeCons();
        var tmp = document.createElement('div');
        tmp.appendChild(beforeCon);
        beforeCon = tmp.innerHTML;
        var elHtml = this.el.innerHTML;
        var bcLen = beforeCon.length;
        var afterCon = elHtml.slice(bcLen);
        var keywordIndex = html.indexOf(this.keyWord)+1;
        editHtml = beforeCon + html.slice(0,keywordIndex) + html.slice(keywordIndex) +afterCon;
        this.el.innerHTML = editHtml;
        this.el.focus();
        var span = document.getElementById('at'+this.at_index);
        //range.setStart(span,0);
        //range.setEnd(span,0);
        // this.range.setStartAfter(span);
    }

    //插入字符串到光标所在区域
    detectKeyword.prototype.insertText = function(text){
        if(typeof text != 'string')return;
        var bool = this.beforeInsertText(text);
        if(bool === false)return;
        if(isIe){
            range.pasteHTML(text);
        }else{
            if(canCmd){
                document.execCommand("insertHTML", false,text);
            }else{
                this.insertHtml(text);
            }
        }
        this.afterInsertText();
    }

    //插入字符串到光标所在区域后的回调
    detectKeyword.prototype.afterInsertText = function(){

    }
    //插入字符串到光标所在区域前的回调
    detectKeyword.prototype.beforeInsertText = function(){

    }
    //生成具有class为'at_span'的span元素前的回调
    detectKeyword.prototype.beforecreateSpan = function(box,editor,range){
        
    }

    //获取当前光标前面的innerHTML字符串
    detectKeyword.prototype.getBeforeCons = function(){
        if(!this.range)return "";
        var precedingChar;
        if(!isIe){
            if(this.sel.rangeCount>0){
                this.range = this.sel.getRangeAt(0).cloneRange();
                this.range.collapse(true);
                this.range.setStart(this.el, 0);
                precedingChar = this.range.cloneContents();
            }else{
                return "";
            }
        }else{
            this.range = this.sel.createRange();
            precedingRange = this.range.duplicate();
            precedingRange.moveToElementText(this.el);
            precedingRange.setEndPoint("EndToStart", this.range);
            precedingChar = precedingRange.htmlText;
        }
        return precedingChar;
    }

    //获取当前光标前面的第一个元素节点
    detectKeyword.prototype.getPointAtNode = function(){
        if(!this.range)return;
        var precedingChar = this.getBeforeCons(),curNode;

        if(!precedingChar)return "";
        if(!canCmd){
            curNode = document.createElement('div');
            curNode.appendChild(precedingChar);
            return curNode;
        }
        if(!isIe){
            curNode = precedingChar.lastChild;
        }else{
            var div = document.createElement('div');
            div.innerHTML = precedingChar;
            curNode = div.lastChild;
        }
        return curNode;
    }

    //根据当前光标位置前的第一个元素来操作
    detectKeyword.prototype.checkBeforePointNode = function(trueToShow){
        var curNode = this.getPointAtNode();
        trueToShow !== undefined || (trueToShow = true);
        var trueFn = trueToShow ? showBox : hideBox;
        var falseFn = !trueToShow ? showBox : hideBox;
        if(!this.box || !hasBox(this.box))return false;
        if(!curNode){
            hideBox(this.box);
            return false;
        }
        //if(curNode.id == 'tmp')curNode = curNode.lastChild;
        if(!curNode || curNode.nodeType != 1){
            hideBox(this.box);
            return false;
        };
        if(curNode.className.indexOf('at_span')>-1){
            this.curAtIndex = parseInt(curNode.id.replace('at',''));
            trueFn(this.box,this.curAtIndex);
            return true;
        }else{
            falseFn(this.box,this.curAtIndex);
            return false;
        }
    }

    //某个元素是否具有指定元素
    function hasBox(box,parent){
        parent = parent || body;
        if(parent.hasChildNodes){
            for(var i in parent.childNodes){
                if(box == parent.childNodes[i]){
                    return true;
                }
            }
        }
        return false;
    }

    //创建提示框
    function createBox(box,curAtIndex){
        if(curAtIndex === undefined || curAtIndex == null)return;
        boxPos(box,curAtIndex);
        if(hasBox(box)){
            showBox(box,curAtIndex);
            return;
        };
        box.style['position'] = "absolute";
        box.textContent = "想要安置的内容"
        body.appendChild(box);
    }

    //定位并显示提示框
    function showBox(box,curAtIndex){
        boxPos(box,curAtIndex);
        box.style['display'] = "block";
    }

    //隐藏提示框
    function hideBox(box){
        box.style['display'] = "none";
    }

    //定位提示框
    function boxPos(box,curAtIndex){
        var span = document.getElementById('at'+curAtIndex);
        var pos = span.getBoundingClientRect();
        box.style['left'] = (pos.left+12)+'px';
        box.style['top'] = (pos.top + pos.height)+'px';
    }

    //移出提示框
    function removeBox(box){
        hasBox(body) && body.removeChild(box);
    }

    return window.detectKeyword = detectKeyword;
    
},window)