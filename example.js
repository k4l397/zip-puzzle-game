let clicks = [];
let click = [];
let t = 0;
let arrayCount = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  click.push([round(mouseX / 50) * 50, round(mouseY / 50) * 50]);
}

function keyPressed() {
  if (keyCode == 8) {
    click.pop();
  } else if (keyCode == 83) {
    saveCanvas("sign.png");
  }
}

function touchStarted() {
  click.push([round(mouseX / 50) * 50, round(mouseY / 50) * 50]);
}

function draw() {
  module = 50;

  frameRate(30);
  background(255, 255, 0);
  for (let j = 0; j < windowWidth / module; j++) {
    strokeWeight(1);
    stroke(0);
    line(module * j, 0, module * j, windowHeight);
  }

  for (let j = 0; j < windowHeight / module; j++) {
    strokeWeight(1);
    stroke(0);
    line(0, module * j, windowWidth, module * j);
  }

  push();
  noFill();
  stroke(0);
  strokeWeight(100);
  strokeJoin(ROUND);

  beginShape();
  click.forEach((item) => {
    vertex(item[0], item[1]);
  });
  endShape();
  pop();

  push();
  noFill();
  stroke(255);
  strokeWeight(95);
  strokeJoin(ROUND);

  beginShape();
  click.forEach((item) => {
    vertex(item[0], item[1]);
  });
  endShape();
  pop();

  push();
  noFill();
  stroke(0);
  strokeWeight(60);
  strokeJoin(ROUND);

  beginShape();
  click.forEach((item) => {
    vertex(item[0], item[1]);
  });
  endShape();
  pop();

  click.forEach((item) => {
    strokeWeight(15);
    strokeJoin(ROUND);
    stroke(255);
    fill(0);

    ellipse(item[0], item[1], 58);
    strokeWeight(0);
    fill(255);
    ellipse(item[0], item[1], 10);
    // stroke(0);
    // strokeWeight(35);
    // textSize(30)
    // textStyle(BOLD)
    // textAlign(CENTER)
    // text(item[0]+"-"+item[1],item[0], item[1]+8)
    // stroke(255);
    // strokeWeight(30);
    // textSize(30)
    // textStyle(BOLD)
    // textAlign(CENTER)
    // text(item[0]+"-"+item[1],item[0], item[1]+8)
  });

  strokeWeight(3);

  //   if (click.length > 1) {
  //     let offset = ((1 / click.length) * click.length) / 6;
  //     let spd = 0.01;
  //     t = t + spd;
  //     for (let k = 0; k < click.length * 20; k++) {
  //       t2 = floor(t + offset * k) % click.length;

  //       startIndex = t2;
  //       endIndex = (startIndex + 1) % click.length;

  //       start = [click[startIndex][0], click[startIndex][1]];
  //       end = [click[endIndex][0], click[endIndex][1]];

  //       xA = start[0];
  //       yA = start[1];
  //       xB = end[0];
  //       yB = end[1];

  //       d = dist(xA, yA, xB, yB);
  //       magnitude = map(d, 0, windowWidth, 2, 0);
  //       fill(0);

  //       t3 = t + offset * k;

  //       xFinal = map(t3 % click.length, startIndex, startIndex + 1, xA, xB, true);
  //       yFinal = map(t3 % click.length, startIndex, startIndex + 1, yA, yB, true);

  //       stroke(0);
  //       fill(255, 255, 0);

  //       ellipse(xFinal, yFinal, 56);
  // //       fill(0);
  // //       ellipse(xFinal, yFinal, 20);
  //     }
  //   }
}

class Click {
  constructor(array) {
    this.array = array;
  }
}
