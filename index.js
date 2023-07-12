
const config = {
  src: './people.png',
  rows: 15,
  cols: 7
};


// UTILS

const randomRange = (min, max) => min + Math.random() * (max - min);

// 随机数
const randomIndex = array => randomRange(0, array.length) | 0;

const removeFromArray = (array, i) => array.splice(i, 1)[0];

const removeItemFromArray = (array, item) => removeFromArray(array, array.indexOf(item));

const removeRandomFromArray = array => removeFromArray(array, randomIndex(array));

const getRandomFromArray = (array) =>
  array[randomIndex(array) | 0];


// TWEEN FACTORIES
// 重置人的各种属性
const resetPeep = ({ stage, peep }) => {
  // 随机方向
  const direction = Math.random() > 0.5 ? 1 : -1;
  // using an ease function to skew random to lower values to help hide that peeps have no legs
  // 偏移，以隐藏图片没有腿的事实
  const offsetY = 100 - 250 * gsap.parseEase('power2.in')(Math.random());
  const startY = stage.height - peep.height + offsetY;
  let startX;
  let endX;
  // 如果是左边的人物
  if (direction === 1) {
    startX = -peep.width;
    endX = stage.width;
    peep.scaleX = 1;
  } else {
    startX = stage.width + peep.width;
    endX = 0;
    peep.scaleX = -1;
  }

  peep.x = startX;
  peep.y = startY;
  // Y轴的拉伸
  peep.anchorY = startY;

  return {
    startX,
    startY,
    endX
  };

};

// 移动
const normalWalk = ({ peep, props }) => {
  const {
    startX,
    startY,
    endX } =
    props;

  // x方向移动的时间
  const xDuration = 10;
  const yDuration = 0.25;

  // 时间轴
  const tl = gsap.timeline();
  // 随机时间轴的播放速度
  tl.timeScale(randomRange(0.5, 1.5));
  // X轴的移动
  tl.to(peep, {
    duration: xDuration,
    x: endX,
    ease: 'none'
  },
    0);
  // Y轴的移动
  tl.to(peep, {
    duration: yDuration,
    repeat: xDuration / yDuration,
    yoyo: true,
    y: startY - 10
  },
    0);

  return tl;
};

const walks = [normalWalk];


// CLASSES

class Peep {
  constructor({
    image,
    rect }) {
    this.image = image;
    this.setRect(rect);

    this.x = 0;
    this.y = 0;
    this.anchorY = 0;
    this.scaleX = 1;
    this.walk = null;
  }

  setRect(rect) {
    this.rect = rect;
    // 实际宽高
    this.width = rect[2];
    this.height = rect[3];

    this.drawArgs = [
      this.image,
      ...rect,
      0, 0, this.width, this.height
    ];

  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scaleX, 1);
    ctx.drawImage(...this.drawArgs);
    ctx.restore();
  }

}


// MAIN

const img = document.createElement('img');
img.onload = init;
img.src = config.src;

const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

const stage = {
  width: 0,
  height: 0
};


// 装人物的盒子
const allPeeps = [];
const availablePeeps = [];
// 做好动画的人群盒子
const crowd = [];

// 入口文件
function init() {
  createPeeps();

  // resize also (re)populates the stage
  resize();

  gsap.ticker.add(render);
  window.addEventListener('resize', resize);
}

function createPeeps() {
  // 获取几行几列
  const {
    rows,
    cols } =
    config;
  const {
    naturalWidth: width,
    naturalHeight: height } =
    img;
  // 总共有多少人
  const total = rows * cols;
  // 一个人所占的宽度
  const rectWidth = width / rows;
  const rectHeight = height / cols;

  for (let i = 0;i < total;i++) {
    allPeeps.push(new Peep({
      image: img,
      rect: [
        i % rows * rectWidth,
        (i / rows | 0) * rectHeight,
        rectWidth,
        rectHeight]
    }));
  }
}

// 改变尺寸
function resize() {
  stage.width = canvas.clientWidth;
  stage.height = canvas.clientHeight;
  canvas.width = stage.width * devicePixelRatio;
  canvas.height = stage.height * devicePixelRatio;

  // 删除原来的人物
  crowd.forEach(peep => {
    peep.walk.kill();
  });

  crowd.length = 0;
  availablePeeps.length = 0;
  availablePeeps.push(...allPeeps);

  initCrowd();
}

function initCrowd() {
  while (availablePeeps.length) {
    // setting random tween progress spreads the peeps out
    // 随机播放，让人物分散开
    addPeepToCrowd().walk.progress(Math.random());
  }
}

// 添加人物到人群中
function addPeepToCrowd() {
  // 随机取出一个人物
  const peep = removeRandomFromArray(availablePeeps);
  // 随机取出一个walks数组，并调用
  const walk = getRandomFromArray(walks)({
    peep,
    props: resetPeep({
      peep,
      stage
    })
  }).eventCallback('onComplete', () => {
    // 时间轴准备完毕
    removePeepFromCrowd(peep);
    addPeepToCrowd();
  });
  // 将时间轴赋予对象的walk属性
  peep.walk = walk;

  crowd.push(peep);
  // 根据偏移值排序，大的再上方
  crowd.sort((a, b) => a.anchorY - b.anchorY);

  return peep;
}

function removePeepFromCrowd(peep) {
  // 从人群中删除已经创建好动画的人物
  removeItemFromArray(crowd, peep);
  availablePeeps.push(peep);
}

// 心跳函数
function render() {
  canvas.width = canvas.width;
  ctx.save();
  ctx.scale(devicePixelRatio, devicePixelRatio);

  crowd.forEach(peep => {
    peep.render(ctx);
  });

  ctx.restore();
}