import './style.css'

import { Engine, Runner, Bodies, Composite, Body, Collision, type IBodyDefinition, Sleeping } from "matter-js"

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const hit = document.getElementById("hit") as HTMLAudioElement;
hit.preservesPitch = false

let score = 0;
let score2 = 0;

const g = canvas.getContext("2d")!;

const engine = Engine.create();
engine.gravity.y = 2

const ERAD = 10000
const BRAD = 40
const TBRAD = 20
const ground = Bodies.circle(canvas.width/2, ERAD+canvas.height*0.75, ERAD, { isStatic: true, friction: 0 }, 256);
const leftWall = Bodies.rectangle(-100, canvas.height/2, 200, canvas.height*2, { isStatic: true })
const rightWall = Bodies.rectangle(canvas.width+100, canvas.height/2, 200, canvas.height*2, { isStatic: true })
const roof = Bodies.rectangle(canvas.width/2, -100, canvas.width*2, 200, { isStatic: true })
const net = Bodies.rectangle(canvas.width/2, canvas.height*(0.65+0.055), 8, canvas.height*0.11, { isStatic: true, friction: 0 });

const BOPT : IBodyDefinition = { frictionAir: 0, restitution: 0.1, mass: 5 }

const ball = Bodies.circle(BRAD, BRAD, BRAD, BOPT);
const ball2 = Bodies.circle(canvas.width-BRAD, BRAD, BRAD, BOPT);
const theBall = Bodies.circle(canvas.width/2, canvas.height/2, TBRAD, { frictionAir: 0.015, restitution: 0.8, mass: 0.1 });
let scoreLast = Math.random() < 0.5 ? ball : ball2;

Composite.add(engine.world, [ground, leftWall, rightWall, roof, net, ball, ball2, theBall])

const runner = Runner.create();
Runner.run(runner, engine)

const keys : Record<string, boolean> = {}

const MFORCE = 0.65;

function resetGame() {
  // Body.setPosition(theBall, { x: canvas.width/2, y: canvas.height/2 })
  Body.setPosition(ball, { x: canvas.width*0.25, y: canvas.height*0.7 })
  Body.setPosition(ball2, { x: canvas.width*0.75, y: canvas.height*0.7 })

  Body.setPosition(theBall, { x: scoreLast.position.x, y: scoreLast.position.y - BRAD-TBRAD-10 })
  Body.setVelocity(theBall, { x: 0, y: 0 })
  Body.setVelocity(ball, { x: 0, y: 0 })
  Body.setVelocity(ball2, { x: 0, y: 0 })

  Sleeping.set(theBall, true)
}
resetGame()

let paused = false
let didHit = false

function updateBall(body: Body, left: boolean, right: boolean, delta: number) {
  let xforce = 0
  if (left) {
    xforce -= 1.0;
  }
  if (right) {
    xforce += 1.0;
  }

  Body.setVelocity(body, { x: xforce * MFORCE * delta, y: body.velocity.y })
}

function update(delta: number) {
  if (paused) return

  updateBall(ball, keys.a, keys.d, delta);
  updateBall(ball2, keys.ArrowLeft, keys.ArrowRight, delta);

  let col = Collision.collides(ball, theBall) || Collision.collides(ball2, theBall);
  if (!didHit && col) {
    if (theBall.isSleeping) {
      Sleeping.set(theBall, false)
    }
    didHit = true;
    hit.playbackRate = Math.random()*2.0 + 0.5;
    hit.play()
    // theBall.force.y -= 0.001
    // Body.applyForce(theBall, theBall.position, { x: 0, y: -0.1 })
  } else {
    didHit = false
  }

  col = Collision.collides(theBall, ground);
  if (col) {
    paused = true
    if (theBall.position.x > canvas.width/2) {
      score++;
      scoreLast = ball
    } else {
      score2++;
      scoreLast = ball2
    }
    runner.enabled = false;
    setTimeout(() => {
      runner.enabled = true
      paused = false
      resetGame();
    }, 200)
  }
}

let now = performance.now();
function render() {
  let t2 = performance.now();
  const delta = t2 - now;
  now = t2;

  update(delta)

  g.fillStyle = "cyan"
  g.fillRect(0, 0, canvas.width, canvas.height);

  g.fillStyle = "green";
  // g.fillRect(0, canvas.height*0.75, canvas.width, canvas.height*0.25);
  g.beginPath();
  g.ellipse(ground.position.x, ground.position.y, ERAD, ERAD, 0, 0, Math.PI*2);
  g.fill()

  g.fillStyle = "white"
  g.fillRect(net.position.x-4, canvas.height*0.65, 8, canvas.height*0.11);

  g.fillStyle = "magenta";
  g.beginPath();
  g.ellipse(ball.position.x, ball.position.y, BRAD, BRAD, 0, 0, Math.PI*2);
  g.fill()


  g.font = "bold 48px sans-serif"
  g.fillText(`${score}`, 50, 50)

  g.fillStyle = "blue";
  g.beginPath();
  g.ellipse(ball2.position.x, ball2.position.y, BRAD, BRAD, 0, 0, Math.PI*2);
  g.fill()

  let str = `${score2}`
  let m = g.measureText(str)
  g.fillText(str, canvas.width-50-m.width, 50)

  g.fillStyle = "white";
  g.beginPath();
  g.ellipse(theBall.position.x, theBall.position.y, TBRAD, TBRAD, 0, 0, Math.PI*2);
  g.fill()
  
  requestAnimationFrame(render);
}

const JMP = 0.25
function keyDown(event : KeyboardEvent) {
  if (event.key === "w") {
    if (Collision.collides(ball, ground)) {
      Body.applyForce(ball, ball.position, { x: 0, y: -JMP })
    }
  }
  if (event.key === "ArrowUp") {
    if (Collision.collides(ball2, ground)) {
      Body.applyForce(ball2, ball2.position, { x: 0, y: -JMP })
    }
  }
}

window.addEventListener("keydown", (event) => {
  if (!keys[event.key]) {
    keys[event.key] = true
    keyDown(event)
  }
})

window.addEventListener("keyup", (event) => {
  keys[event.key] = false
})

render();

