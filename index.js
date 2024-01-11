const modalStart = document.querySelector('.modal-start')
const startBtn = document.querySelector('.start-btn')
const modalGameOver = document.querySelector('.modal-gameover')
//Canvas
const content = document.querySelector('.content-game')
const canvas = document.querySelector('canvas')
const context = canvas.getContext('2d') //allows to draw and manipulate 2D shapes and graphics

//Player's info
const playerInfo = document.querySelector('.player-info')
const score = document.querySelector('.score')
const lives = document.querySelector('.lives')
//Game's sounds
const introGame = document.querySelector('.intro-game')
const projectileSound = document.querySelector('.projectile-shot')
const asteroidSound = document.querySelector('.asteroid-destroy')
const gameOver = document.querySelector('.game-over-effect')

canvas.width = content.clientWidth
canvas.height = content.clientHeight 

//to make the game responsive to any width
function updateCanvasSize() {
    canvas.width = content.clientWidth;
    canvas.height = content.clientHeight;
}
window.addEventListener('resize', updateCanvasSize);
updateCanvasSize();

class Player {
    constructor({position, velocity}) {
        this.position = position // {x, y}
        this.velocity = velocity
        this.rotation = 0
    }

    draw() {
        context.save()

        context.translate(this.position.x, this.position.y)
        context.rotate(this.rotation)
        context.translate(-this.position.x, -this.position.y) //to restore the position

        //to draw the circle that represents the centre of the canvas
        context.beginPath()
        context.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2, false)
        context.fillStyle = 'yellow'
        context.fill()
        context.closePath()

        // context.fillStyle = 'red'
        // context.fillRect(this.position.x, this.position.y, 100, 100)
        context.beginPath()
        context.moveTo(this.position.x + 30, this.position.y) 
        //to draw a triangle
        context.lineTo(this.position.x - 10, this.position.y - 10) // '\'
        context.lineTo(this.position.x - 10, this.position.y + 10) // '/'
        context.closePath() // will automatically draw the final line for us
        //stile del tratto
        context.strokeStyle = 'white'
        context.stroke()

        context.restore()
    }

    update(){
        this.draw()
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y
    }

    getVertices() {
        const cos = Math.cos(this.rotation)
        const sin = Math.sin(this.rotation)
    
        return [
            {
                x: this.position.x + cos * 30 - sin * 0,
                y: this.position.y + sin * 30 + cos * 0,
            },
            {
                x: this.position.x + cos * -10 - sin * 10,
                y: this.position.y + sin * -10 + cos * 10,
            },
            {
                x: this.position.x + cos * -10 - sin * -10,
                y: this.position.y + sin * -10 + cos * -10,
            },
        ]
    }
}

class Projectile {
    constructor({position, velocity}) {
        this.position = position
        this.velocity = velocity
        this.radius = 5
    }

    draw(){
        context.beginPath()
        context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false)
        context.closePath()
        context.fillStyle = 'white'
        context.fill()
    }

    update() {
        this.draw()
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y
    }
}

class Asteroid {
    constructor({position, velocity, radius}) {
        this.position = position
        this.velocity = velocity
        this.radius = radius
    }

    //the design
    draw() {
        context.beginPath();
        context.moveTo(this.position.x + this.radius, this.position.y);
        context.lineTo(this.position.x + this.radius * 0.6, this.position.y - this.radius * 0.8);
        context.lineTo(this.position.x + this.radius * 0.2, this.position.y - this.radius * 0.6);
        context.lineTo(this.position.x - this.radius * 0.5, this.position.y - this.radius * 0.8);
        context.lineTo(this.position.x - this.radius * 0.8, this.position.y);
        context.lineTo(this.position.x - this.radius * 0.5, this.position.y + this.radius * 0.6);
        context.lineTo(this.position.x + this.radius * 0.2, this.position.y + this.radius * 0.8);
        context.lineTo(this.position.x + this.radius * 0.6, this.position.y + this.radius * 0.4);
        context.closePath();
        context.strokeStyle = 'white'; 
        context.stroke();
    }

    //check whether or not to split the asteroid
    splitAsteroid() {
        if (this.radius > 30) {
            const newRadius = this.radius / 2; // Dividi l'asteroide in due nuovi asteroidi
            asteroids.push(new Asteroid({
                position: { x: this.position.x, y: this.position.y },
                velocity: { x: this.velocity.x, y: this.velocity.y },
                radius: newRadius
            }));
            asteroids.push(new Asteroid({
                position: { x: this.position.x, y: this.position.y },
                velocity: { x: -this.velocity.x, y: -this.velocity.y },
                radius: newRadius
            }));
        }
        playerScore += 10;
        score.textContent = `SCORE: ${playerScore}`;
    }

    update() {
        this.draw()
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y
    }
}

const player = new Player({
    position: { x: canvas.width/2, y: canvas.height/2 },
    velocity: { x: 0, y: 0 },
})

//represents the non-pressed state of the 'w', 'a' and 'd' keys
const keys = {
    w: {
        pressed: false
    },
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    r: {
        pressed: false
    }
}

const SPEED = 3
const ROTATIONAL_SPEED = 0.05
const FRICTION = 0.97
const PROJECTILE_SPEED = 5

const projectiles = []
const asteroids = []

let playerScore = 0
let playerLives = 3

let intervalId
let animationId

//to spawn(generare) asteroids
function generateAsteroids() {
    intervalId = window.setInterval(()=> {
        //random positions
        const index = Math.floor(Math.random() * 12)
        let x, y
        let vx, vy //velocity
        let radius = 50 * Math.random() + 10

        //asteroids directions
        switch (index) {
            case 0: // left forwards
                x = 0 - radius
                y = Math.random() * canvas.height
                vx = 1
                vy = 0
                break
            case 1: // bottom forwards
                x = Math.random() * canvas.width
                y = canvas.height + radius
                vx = 0
                vy = -1
                break
            case 2: // right forwards
                x = canvas.width + radius
                y = Math.random() * canvas.height
                vx = -1
                vy = 0
                break
            case 3: // top forwards
                x = Math.random() * canvas.width
                y = 0 - radius
                vx = 0//1 top-right
                vy = 1
                break
            case 4: //left-bottom
                x = 0 - radius
                y = Math.random() * canvas.height
                vx = 1
                vy = 1
                break
            case 5: //left-top
                x = 0 - radius
                y = Math.random() * canvas.height
                vx = 1
                vy = -1
                break
            case 6: // bottom-left
                x = Math.random() * canvas.width
                y = canvas.height + radius
                vx = -1
                vy = -1
                break
            case 7: // bottom-right
                x = Math.random() * canvas.width
                y = canvas.height + radius
                vx = 1
                vy = -1
                break
            case 8: // right-bottom
                x = canvas.width + radius
                y = Math.random() * canvas.height
                vx = -1
                vy = 1
                break
            case 9: // right-top
                x = canvas.width + radius
                y = Math.random() * canvas.height
                vx = -1
                vy = -1
                break
            case 10: // top-right
                x = Math.random() * canvas.width
                y = 0 - radius
                vx = 1
                vy = 1
                break
            case 11: // top-left
                x = Math.random() * canvas.width
                y = 0 - radius
                vx = -1
                vy = 1
                break
        }

        //create asteroids
        asteroids.push(new Asteroid({
            position: {
                x: x,
                y: y,
            },
            velocity: {
                x: vx,
                y: vy,
            },
            radius,
        }))
        // console.log(asteroids)
    }, 1500)
}

//confirms the collision between the projectile and the asteroid
function circleCollision(circle1, circle2) {
    const xDifference = circle2.position.x - circle1.position.x
    const yDifference = circle2.position.y - circle1.position.y
    
    const distance = Math.sqrt(xDifference * xDifference + yDifference * yDifference)
    if (distance <= circle1.radius + circle2.radius) {
        console.log('two have collided')
        return true
    }
    return false
}

//confirms the collision between the player and the asteroid
function circleTriangleCollision(circle, triangle) {
    // Check if the circle is colliding with any of the triangle's edges
    for (let i = 0; i < 3; i++) {
        let start = triangle[i]
        let end = triangle[(i + 1) % 3]
    
        let dx = end.x - start.x
        let dy = end.y - start.y
        let length = Math.sqrt(dx * dx + dy * dy)
    
        let dot =
            ((circle.position.x - start.x) * dx +
            (circle.position.y - start.y) * dy) /
            Math.pow(length, 2)
    
        let closestX = start.x + dot * dx
        let closestY = start.y + dot * dy
    
        if (!isPointOnLineSegment(closestX, closestY, start, end)) {
            closestX = closestX < start.x ? start.x : end.x
            closestY = closestY < start.y ? start.y : end.y
        }
    
        dx = closestX - circle.position.x
        dy = closestY - circle.position.y
    
        let distance = Math.sqrt(dx * dx + dy * dy)
    
        if (distance <= circle.radius) {
            return true
        }
    }
  
    // No collision
    return false
}

function isPointOnLineSegment(x, y, start, end) {
    return (
        x >= Math.min(start.x, end.x) &&
        x <= Math.max(start.x, end.x) &&
        y >= Math.min(start.y, end.y) &&
        y <= Math.max(start.y, end.y)
    )
}

//start the canvas
function animate() {
    animationId = window.requestAnimationFrame(animate)

    context.fillStyle = 'black'
    context.fillRect(0, 0, canvas.width, canvas.height)

    player.update()

    //projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i]
        projectile.update()
        
        //garbage collection for projectiles, remove from the array the ones that exceed the borders of the canvas
        if (projectile.position.x + projectile.radius < 0 ||
            projectile.position.x - projectile.radius > canvas.width ||
            projectile.position.y - projectile.radius > canvas.height ||
            projectile.position.y + projectile.radius < 0
            ) {
                projectiles.splice(i, 1)
            }
        }

    //asteroids management
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i]
        asteroid.update()

        if (circleTriangleCollision(asteroid, player.getVertices())) {
            console.log('Player HIT');
            playerLives--;
            console.log(`Lives: ${lives}`);
            lives.textContent = `LIVES: ${playerLives}`

            if (playerLives <= 0) {
                console.log('GAME OVER');
                modalGameOver.style.display = 'flex';
                introGame.pause();
                gameOver.play();
                window.cancelAnimationFrame(animationId);
                clearInterval(intervalId);
            } else {
                player.position = { x: canvas.width / 2, y: canvas.height / 2 };
                player.velocity = { x: 0, y: 0 };
            }
        }
        
        //garbage collection for asteroids, remove from the array the ones that exceed the borders of the canvas
        if (asteroid.position.x + asteroid.radius < 0 ||
            asteroid.position.x - asteroid.radius > canvas.width ||
            asteroid.position.y - asteroid.radius > canvas.height ||
            asteroid.position.y + asteroid.radius < 0
        ) {
            asteroids.splice(i, 1)
        }

        //projectiles collision
        for (let j = projectiles.length - 1; j >= 0; j--) {
            const projectile = projectiles[j]
            
            if (circleCollision(asteroid, projectile)) {
                asteroidSound.play();
                asteroid.splitAsteroid(); // Applica la logica di divisione/scomparsa
                asteroids.splice(i, 1);
                projectiles.splice(j, 1);

                if (asteroid.radius <= 20) {
                    playerScore += 10;
                } else if (asteroid.radius === 40) {
                    playerScore += 15;
                } else if (asteroid.radius > 40) {
                    playerScore += 20;
                }
                score.textContent = `SCORE: ${playerScore}`;
            }
        }
    }
    
    //game controls
    if (keys.w.pressed) {
        player.velocity.x = Math.cos(player.rotation) * SPEED
        player.velocity.y = Math.sin(player.rotation) * SPEED
    } else if (!keys.w.pressed) {
        //the player takes a little bit of time to slow
        player.velocity.x *= FRICTION
        player.velocity.y *= FRICTION
    }

    if (keys.d.pressed) player.rotation += ROTATIONAL_SPEED
        else if (keys.a.pressed) player.rotation -= ROTATIONAL_SPEED
}

//the game CONTROLS
window.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            keys.w.pressed = true
            break
        case 'KeyA':
        case 'ArrowLeft':
            keys.a.pressed = true
            break
        case 'KeyD':
        case 'ArrowRight':
            keys.d.pressed = true
            break
        case 'Space':    
            projectileSound.play()    
            projectiles.push(new Projectile({
                position: {
                    x: player.position.x + Math.cos(player.rotation) * 30,
                    y: player.position.y + Math.sin(player.rotation) * 30,
                },
                velocity: {
                    x: Math.cos(player.rotation) * PROJECTILE_SPEED,
                    y: Math.sin(player.rotation) * PROJECTILE_SPEED,
                },
            }))
            break
        case 'KeyR':
            keys.r.pressed = true
            player.position = { x: canvas.width / 2, y: canvas.height / 2 };
            player.velocity = { x: 0, y: 0 };
            break
    }
})

window.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            keys.w.pressed = false
            break
        case 'KeyA':
        case 'ArrowLeft':
            keys.a.pressed = false
            break
        case 'KeyD':
        case 'ArrowRight':
            keys.d.pressed = false
            break
    }
})

//start Asteroids game
startBtn.addEventListener('click', () => {
    modalStart.style.display = 'none'
    playerInfo.style.display = 'flex'
    introGame.play()
    clearCanvas()
    generateAsteroids()
    animate()
});

//reset the game
function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    projectiles.length = 0;
    asteroids.length = 0;
    player.position = { x: canvas.width / 2, y: canvas.height / 2 };
    player.velocity = { x: 0, y: 0 };
    clearInterval(intervalId); 
}

const resetBtn = document.querySelector('.reset-btn')
resetBtn.addEventListener('click', () => {
    modalGameOver.style.display = 'none'
    playerInfo.style.display = 'none'
    modalStart.style.display = 'flex'
    clearCanvas()
    playerScore = 0
    playerLives = 3
    score.textContent = `SCORE: ${playerScore}`
    lives.textContent = `LIVES: ${playerLives}`
});