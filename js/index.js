/* 
在移动端处理滑屏事件的时候，我们要把文档滑动的默认行为禁止掉
*/

$(document).on('touchstart touchmove touchend', function (ev) {
    ev.preventDefault();
})

/* ===魔方模块=== */
let cubeModule = (function () {

    let $cubeBox = $('.cubeBox'),
        $cube = $cubeBox.children('.cube');

    //down:记录手指的起始坐标和盒子的旋转角度
    function down(ev) {
        let point = ev.changedTouches[0];
        this.startX = point.clientX;
        this.startY = point.clientY;
        if (!this.rotateX) {
            //第一次按下设置初始值。以后再按下，按照上次旋转后的角度移动即可。
            //第一次滑动之前rotateX是不存在的，给它自定义的rotateX赋值。第一次滑动以后，rotateX就不再是-30，所以需要进行判断
            this.rotateX = -30;
            this.rotateY = -45;
        }
        this.isMove = false;
        //this.isMove=>是否发生移动，默认false
    }

    //记录手指在X/Y轴便宜的值，计算出是否发生移动
    function move(ev) {
        let point = ev.changedTouches[0];
        this.changeX = point.clientX - this.startX;
        this.changeY = point.clientY - this.startY;
        if (Math.abs(this.changeX) > 10 || Math.abs(this.changeY) > 10) {
            this.isMove = true;
        }
    }

    //如果发生移动，我们让盒子在原始的旋转角度上继续旋转
    //changeX控制的是Y轴旋转角度，changeY控制的是X轴旋转角度，并且changeY的值和沿着X轴旋转角度的值正好相反（向上移动，changeY为负，按照X轴向上旋转却是正的角度）。
    function up(ev) {
        let point = ev.changedTouches[0],
            $this = $(this);
        if (!this.isMove) return;
        this.rotateY = this.rotateY + this.changeX / 3;
        this.rotateX = this.rotateX - this.changeY / 3;
        //changeX/changeY表示的是偏移值，rotateX/rotateY表示的是角度，偏移值往往较大，所以给偏移值除以3
        $this.css(`transform`, `scale(.8) rotateX(${this.rotateX}deg) rotateY(${this.rotateY}deg)`);
    }

    return {
        init(isInit) {
            $cubeBox.css('display', 'block');
            if(isInit) return;
            //当从详情页点击返回回到魔方首页的时候，就不用再执行下面的操作，所以直接return。返回的就是上次滑动的位置
            $cube.css('transform', 'scale(.8) rotateX(-30deg) rotateY(-45deg);').on('touchstart', down).on('touchmove', move).on('touchend', up);
            //魔方每一面的点击事件:tap——zepto中提供的没有延迟的点击事件
            $cube.children('li').tap(function () {
                $cubeBox.css('display', 'none');
                swiperModule.init($(this).index()+1);
            });
        }
    }
})();


/* ===滑屏模块=== */
let swiperModule = (function () {
    //Swiper的循环模式：把第一张放在末尾，把最后一张放在开始
    let swiperExample = null,
        $baseInfo = null,
        $swiperBox = $('.swiperBox'),
        $returnBox = $('.returnBox');


    function pageMove() {
        $baseInfo = $('.page1 .baseInfo');
        //在这里再获取$baseInfo而不是一开始就获取，是因为在初始化以后$baseInfo才有8张图片，所以在每次执行pageMove的时候都重新获取。否则索引对不上，从第六页切换回第一页时没有效果
        //this:swiperExample——Swiper的实例
        let activeIndex = this.activeIndex,
            slides = this.slides;
        //第一页3D折叠菜单的处理
        if (activeIndex === 1 || activeIndex === 7) {
            //MAKISu的基础配置

            $baseInfo.makisu({
                selector: 'dd',
                overlap: 0.6,
                speed: 0.8
            });
            $baseInfo.makisu('open')
        } else {
            $baseInfo.makisu({
                selector: 'dd',
                overlap: 0,
                speed: 0
            });
            $baseInfo.makisu('close');
        }

        //给当前页面设置ID，让其有动画效果
        //遍历slides的每一项，当其索引与当前滑动到页面的索引相同时，让其有ID
        [].forEach.call(slides, (item, index) => {
            if (index === activeIndex) {
                //开启循环模式，索引为0或7需要再处理一下
                activeIndex === 0 ? activeIndex = 6 : null;
                activeIndex === 7 ? activeIndex = 1 : null;
                item.id = 'page' + activeIndex;
                return;
            }
            item.id = null;
        })
    }
    return {
        init(index = 1) {
            //index=1:根据swiper的循环模式，索引为0的那一张应该是第6张，第一张的索引为1，所以index = 1
            $swiperBox.css('display', 'block');
            if(swiperExample){
                //如果swiperExample已经存在，只需要它能跳转到对应页面就可以了，不需要再重新创建实例进行操作
                swiperExample.slideTo(index, 0);
                return;
            }
            swiperExample = new Swiper('.swiper-container', {
                //想让哪个容器实现滑屏效果，就给这个容器加上效果。swiperExample相当于swiper的一个实例
                initialSlide: index,//初始展示第几页,传几就展示第几页，不传默认为0
                direction: 'horizontal',//切换方向，默认为水平方向。垂直方向为：vertical
                loop: true,//循环模式
                effect: 'coverflow',//切换效果。还支持的效果有'cube'、'fade'、'coverflow'、'flip'...
                on: {
                    //当什么什么时候做什么事情
                    init: pageMove,//init：初始化成功做什么
                    transitionEnd: pageMove,//transitionEnd：切换结束的时候做什么
                }
            });
            swiperExample.slideTo(index, 0);//swiper中有一个方法slideTo，控制swiper切换到指定的slide，三个参数分别是index,speed,runCallbacks。index是其索引，speed是切换速度，runCallbacks切换到这一页做的事情。通过实例调用swiper上的方法。
            //不写runCallbacks，默认为true。会自动触发on下的transitionEnd方法

            //点击返回按钮
            $returnBox.tap(function(){
                $swiperBox.css('display', 'none');
                cubeModule.init(true);
            });
        }
    }
})();


cubeModule.init();
//目前存在的一点瑕疵是，当魔方上下反转以后，鼠标向左划魔方却向右移。通过象限去解决这个问题

// swiperModule.init();


/* ===音乐的处理=== */
function handleMusic(){
    let $musicAudio = $('.musicAudio'),
        musicAudio = $musicAudio[0],
        $musicIcon = $('.musicIcon');

        $musicAudio.on('canplay',function(){
            $musicIcon.css('display','block').addClass('move');
        });

        $musicIcon.tap(function(){
            if(musicAudio.paused){
                //当前是暂停状态
                play();
                $musicIcon.addClass('move');
                return;
            }
            //当前是播放状态
            musicAudio.pause();
            $musicIcon.removeClass('move');
        });

        function play(){
            //原生JS对象可以直接调用play方法
            musicAudio.play(); 
            document.removeEventListener('touchstart',play); 
        }
        play();

        //兼容处理
        document.addEventListener('WeixinJSBridgeReady',play);
        document.addEventListener('YixinJSBridgeReady',play);
        document.addEventListener('touchstart',play);        
}

setTimeout(handleMusic,1000);



/*
* zepto 和 jquery的区别？
    zepto专门为移动端开发准备的，所以没有考虑PC端IE的兼容问题，所以zepto要比jquery小的多；而且还有一方面，也导致了zepto比jquery小：zepto只实现了jquery中最常用的方法（例如sildeDown/slideUp/slideToggle等快捷动画在zepto中都没有）；
    1.JQ中设置样式和实现动画的时候，不支持CSS3中的某些样式属性的设置，例如:transform。但是ZP中支持了这样的处理
    2.ZP中单独提供了一些移动端常用的事件方法：tap点击/singleTap单击/doubleTap双击/longTap长按/swipe滑动/swipeLeft向左划/swipeRight/swipeUp/swipeDown/pinchIn缩小/pinchOut放大...而这些方法JQ中都没有

    移动端能用click事件行为吗？
    PC端click是点击事件，移动端的click是单击事件（所以在移动端使用click会存在300ms延迟的问题，在第一次触发后会等待300ms，看是否有第二次触发，存在则为双击，不存在才是单击）=>移动端的所有操作基本上都是基于tuoch/gesture事件模型模拟出来的

*   移动端常用事件库
    - zepto
    - fastclick:解决移动端click300ms延迟问题的
    - hammer.js:国际上通用的移动端手指事件库

*   移动端键盘事件和PC端的区别
    移动端是虚拟键盘，所以对于keydown/keyup/keypress兼容很差，想实现类似的需求，需要用input事件完成（input事件：移动端文本框内容输入事件）
    userInp.addEventListener('input',function(ev){});
*/

/* $(document.body).tap(function(ev){
    console.log('ZP:我是点击');
});

document.body.addEventListener('touchstart',function(ev){
    //ev:TouchEvent
    //touches / changedTouches:存储每根手指的操作信息（它是一个集合，对于TOUCH单手指事件来说，集合中只有一项）/ changedTouches存储的是手指发生改变操作的信息，但是最开始按下的时候和touches是一样的，但是它可以在手指离开的事件中获取到手机离开瞬间的信息，而touches在离开的时候则没有，真实项目中一般用changedTouches
    let point = ev.changedTouches[0];
    //changedTouches得到的是一个集合，单手指事件信息第一项就是手指信息
    this.startX = point.clientX;
    this.startY = point.clientY;
    this.isMove = false;
})
document.body.addEventListener('touchmove',function(ev){
    let point = ev.changedTouches[0],
    changeX = point.clientX - this.startX,
    changeY = point.clientY - this.startY;
    if(Math.abs(changeX)>=30 || Math.abs(changeY)>=30){
        this.isMove = true;
    }
    this.isMove = false;
})
document.body.addEventListener('touchend',function(ev){
    if(this.isMove){
        console.log('这是移动操作');
        return;
    }
    console.log('这是点击操作');
}) */



