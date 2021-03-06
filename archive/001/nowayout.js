//TODO Refactorizar usando ECMASCRIPT 6 class. y mandar a la chucha a IE.
//TODO Más enemigos
//TODO habilidades especiales para player
//TODO Selector de dificultad
//TODO Plan de Escenas generator
//TODO Editor de escenarios
//TODO Responsiveness or Android fork

/**
 * NoWayOut
 *
 * Autor Andrés Reyes a.k.a. Oldman Jake
 * juego de bacteria cuadrada vs bacterias redondas
 */

//Fucking funciÃ³n para generar un entero aleatorio dentro de un rango
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//fucking función que devuelve 1 si parametro es  + y -1 si parametro es -
function getSign(n) {
    if (n>=0) {
        return 1;
    }
    return -1;
}

//bitch api para controlar el estado del juego
var State = (function() {

    return {
        running   : 0,
        pausing   : 1,
        ending    : 2
    };
})();

/**
 * MovingBehaviour
 *
 * Proporciona los medios bÃ¡sicos para crear un patron de movimiento
 * dx y dy son los delta, es decir en cuanto se modifica la posiciÃ³n del objeto
 * al moverlo.
 *
 * @param Sprite sprite
 * @param Canvas canvas
 */
var MovingBehaviour = function(sprite, canvas) {
    this.dx = 0;
    this.dy = 0;
    this.sprite = sprite;
    this.canvas = canvas;
};

/**
 * El mÃ©todo  move simplemente agrega los delta a la posiciÃ³n del objeto
 */
MovingBehaviour.prototype.move = function() {
    this.sprite.x += this.dx;
    this.sprite.y += this.dy;
};

MovingBehaviour.prototype.isCollisioning = function (sprite) {

    if (sprite.type == 'rectangle') {
	    return (this.sprite.x < sprite.x + sprite.w &&
		        this.sprite.x + this.sprite.w > sprite.x &&
		        this.sprite.y < sprite.y + sprite.h &&
		        this.sprite.h + this.sprite.y > sprite.y);
    }
};


/**
 * BounceBehaviour
 * Extiende a MovingBehaviour
 *
 * Implementa el comportamiento movimiento rebotar
 * @param {*} sprite
 * @param {*} canvas
 */
var BounceBehaviour = function(sprite, canvas) {
    MovingBehaviour.call(this, sprite, canvas);
};

BounceBehaviour.prototype = Object.create(MovingBehaviour.prototype);

BounceBehaviour.prototype.checkBorderCollision = function() {
    if (this.sprite.x + this.dx > this.canvas.width - this.sprite.r  ||
        this.sprite.x + this.dx < this.sprite.r) {
        this.dx = -this.dx;
    }
    if (this.sprite.y + this.dy > this.canvas.height - this.sprite.r ||
        this.sprite.y + this.dy < this.sprite.r) {
        this.dy = -this.dy;
        return;
    }
};

/**
 * Este mÃ©todo verifica si el objeto padre del comportamiento rebotar estÃ¡
 * tocando a un objeto rectangulo.
 */
BounceBehaviour.prototype.checkRectSpriteCollision = function (rectangle) {
    var dx = Math.abs(this.sprite.x - rectangle.x - rectangle.w/2);
    var dy = Math.abs(this.sprite.y - rectangle.y - rectangle.h/2);

    if (dx > (rectangle.w/2 + this.sprite.r) ||
        dy > (rectangle.h/2 + this.sprite.r)) {
        return 0; // no colisiÃ³n
    }

    if (dx <= (rectangle.w/2)) {
        return 1; //horizontal colision
    }

    if (dy <= (rectangle.h/2)) {
        return 2;  //vertical colision
    }

    dx=dx-rectangle.w/2;
    dy=dy-rectangle.h/2;
    if (dx*dx+dy*dy<=(this.sprite.r * this.sprite.r)) {
        return 3; //random colision
    }

    return 0;
};

/**
 * Implementa el rebote.
 */
BounceBehaviour.prototype.bounce = function (direction) {
    xAxis = (this.xAxis === undefined ? true : this.xAxis);
    yAxis = (this.yAxis === undefined ? true : this.yAxis);
    var bounces = [
        function(ball){
        },
        function(ball){

            ball.move.dy *= (yAxis ? -1 : 1);
        },
        function(ball){
            ball.move.dx *= (xAxis ? -1 : 1);
        },
        function(ball){
            if (getRandomInt(1, 4) === 1){
                ball.move.dx *= (xAxis ? -1 : 1);
            }
            ball.move.dy *= (yAxis ? -1 : 1);
        }
    ];
    bounces[direction](this.sprite);
};

BounceBehaviour.prototype.constructor = BounceBehaviour;

/**
 * Este objeto es el padre de todo lo que se verÃ¡ en la pantalla.
 *
 * @param {*} color
 * @param {*} context
 */
var Sprite = function(color, context) {
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
    this.color   = color;
    this.context = context;
    this.state   = State.idle;
    this.type    = "";
};

Sprite.prototype.isTopTouching    = function (sprite) {};
Sprite.prototype.isBottomTouching = function (sprite) {};
Sprite.prototype.isLeftTouching   = function (sprite) {};
Sprite.prototype.isRightTouching  = function (sprite) {};
Sprite.prototype.draw             = function () {};
Sprite.prototype.move             = function (dir, stregth) {};
Sprite.prototype.onCollision      = function (sprite) {};

/**
 * Esta clase permite crear objetos circulares
 * (Las pelotitas del juego)
 *
 */
var CircleSprite = function(color, context, canvas) {
    Sprite.call(this, color, context);
    this.r  = 2.5;
    this.type = "circle";
    this.move = new BounceBehaviour(this, canvas);
    this.move.dx = 1;
    this.move.dy = 1;
    this.xAxis   = true;
    this.yAxis   = true;
};

CircleSprite.prototype = Object.create(Sprite.prototype);

CircleSprite.prototype.isCollisioning = function (sprite) {
    if (sprite.type === "circle") {
        if (this.x + this.r + sprite.r > sprite.x &&
            this.x < sprite.x + this.r + sprite.r &&
            this.y + sprite.r + sprite.r > sprite.y &&
            this.y < sprite.y + this.r + sprite.r)
        {
            var distance = Math.sqrt(
                ((this.x - sprite.x) * (this.x - sprite.x)) +
                ((this.y - sprite.y) * (this.y - sprite.y))
               );
            return (distance < sprite.r + this.r);
        }

    } else if (sprite.type === "rectangle") {

        if (this.x + this.r >= sprite.x ||
            this.x <= sprite.x + sprite.w) {
            if (this.y + this.r >= sprite.y ||
                this.y -this.r <= sprite.y+sprite.h) {

                return true;
            }
        }
    }
    return false;
};

CircleSprite.prototype.isTopTouching = function(sprite) {
    return this.isCollisioning(sprite);
};

CircleSprite.prototype.isBottomTouching = function(sprite) {
    return this.isCollisioning(sprite);
};

CircleSprite.prototype.isLeftTouching = function(sprite) {
    this.isCollisioning(sprite);
};

CircleSprite.prototype.isRightTouching = function(sprite) {
    return this.isCollisioning(sprite);
};

CircleSprite.prototype.draw = function() {
    this.context.beginPath();
    this.context.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
    this.context.lineWidth = 3;
    this.context.strokeStyle = this.color;
    this.context.stroke();
};

CircleSprite.prototype.constructor = CircleSprite;

var RectSprite = function(color, context) {
    Sprite.call(this, color, context);
    this.type = "rectangle";
};

RectSprite.prototype = Object.create(Sprite.prototype);

//Collision Engine
RectSprite.prototype.isTopTouching = function (sprite) {
    var spBottom = sprite.y + sprite.h;
    var spRight  = sprite.x + sprite.w;
    if (spBottom >= this.y && (spRight > this.x && sprite.x < this.x + this.w)) {
        return true;
    }
    return false;
};

RectSprite.prototype.isBottomTouching = function (sprite) {
    var spRight  = sprite.x + sprite.w;
    if (sprite.y <= this.y && (spRight > this.x && sprite.x < this.x + this.w)) {
        return true;
    }
    return false;
};

RectSprite.prototype.isLeftTouching = function (sprite) {
    var spRight  = sprite.x + sprite.w;
    if (spRight <= this.x && (sprite.y > this.y && sprite.y < this.y + this.h)) {
        return true;
    }
    return false;
};

RectSprite.prototype.isRightTouching = function (sprite) {
    if (sprite.x >= this.x && (sprite.y > this.y && sprite.y < this.y + this.h)) {
        return true;
    }
    return false;
};

RectSprite.prototype.isInScreen = function () {
    return (this.x > this.move.dx+1 &&
            this.x + this.w < this.move.canvas.width - this.move.dx &&
            this.y > this.move.dy+1 &&
            this.y + this.h < this.move.canvas.height - this.move.dy);
};

RectSprite.prototype.draw = function () {
    this.context.beginPath();
    this.context.lineWidth = "1";
    this.context.fillStyle = this.color;
    this.context.fillRect(this.x, this.y, this.w, this.h);
};

RectSprite.prototype.constructor = RectSprite;


var Border = function(color, context) {
    RectSprite.call(this, color, context);
    this.lineWidth = 10;
    this.x = 0;
    this.y = 0;
};

Border.prototype.draw = function() {
    this.context.beginPath();
    this.context.lineWidth = "1";
    this.context.strokeStyle = this.color;
    this.context.strokeRect(this.x, this.y, this.w, this.h);
};

var Player = function(context, canvas) {
    RectSprite.call(this, "#3498db", context);
    //TODO asignar posiciones de partida aleatorias, teniendo en cuenta colisión con plataformas
    this.w = 8;
    this.h = 8;
    this.move = new MovingBehaviour(this, canvas);
    //TODO hacer dependiente velocidad de dificultad seleccionada
    this.move.dx = 3;
    this.move.dy = 3;
    this.x = canvas.width/2 - this.w/2;
    this.y = canvas.height - (this.h*2);
    this.lastX = this.x;
    this.lastY = this.y;
    this.lives = 5;
};

Player.prototype = Object.create(RectSprite.prototype);
Player.prototype.constructor = Player;

var RedBall = function (context, canvas) {
    CircleSprite.call(this, "#c0392b", context, canvas);
    this.subType = "redball";

    this.y   = (getRandomInt(1,2) == 1 ?
    getRandomInt(this.r + 2, canvas.height - this.r - 2) : this.y);

    this.yAxis = true;
    this.xAxis = true;

    if (getRandomInt(1,2) == 1 ) {
        this.x = canvas.width - this.r *2;
        this.move.dx = -1;
    } else {
        this.x = this.r;
        this.move.dx = 1;
    }
    if (getRandomInt(1,2) == 1 ) {
        this.y = canvas.height - this.r *2;
        this.move.dy = -1;
    } else {
        this.y = this.r;
        this.move.dy = 1;
    }
};

RedBall.prototype = Object.create(CircleSprite.prototype);
RedBall.prototype.constructor = RedBall;

var GreenBall = function(context, canvas) {
    CircleSprite.call(this, "#1abc9c", context, canvas);
    this.subType = "greenball";
    this.r = 4;
    if (getRandomInt(1,2) == 1) {
        this.y       = this.r;
        this.x       = getRandomInt(this.r, canvas.width - this.r);
        this.move.dy = 1;
        this.move.dx = 0;
        this.yAxis   = true;
        this.xAxis   = false;
    } else {
        this.x       = this.r;
        this.y       = getRandomInt(this.r, canvas.height - this.r);
        this.move.dx = 1;
        this.move.dy = 0;
        this.yAxis   = false;
        this.xAxis   = true;
    }
};

GreenBall.prototype = Object.create(CircleSprite.prototype);
GreenBall.prototype.constructor = GreenBall;

var OrangeBall = function (context, canvas) {
    CircleSprite.call(this, "#f39c12", context, canvas);
    this.subType = "orangeball";
    this.r = 3;
    this.x = this.r;
    this.y = getRandomInt(this.r, canvas.height - this.r);
    this.move.dx = 1;
    this.move.dy = -1;
    this.fixedy  = this.y;
    this.range   = 30;
    this.angle   = 0;
    this.angleSpeed = 0.10;

    this.move.move = function() {
        this.sprite.x     += this.dx;
        this.sprite.angle += this.sprite.angleSpeed;
        this.sprite.y = this.sprite.fixedy +
                        Math.sin(this.sprite.angle) *
                        this.sprite.range;

    };
};
OrangeBall.prototype = Object.create(CircleSprite.prototype);
OrangeBall.prototype.constructor = OrangeBall;

var Game = (function() {
    var _time = 0;
    var _parent = document.getElementById("canvas-container");
    var _settings = {
            maxPlatforms  : 12,
            height        : 256,
            width         : 512,
            platformHeight: 8,
            platformWidth : 8,
            colorPlatform : "#9b59b6",
            maxJump       : 112,
            /**
             * Basado en la notación Fehn del ajedrez.
             * El plan del escenario es un string conteniendo caracteres separados por /
             * cada segmento separado por / representa una fila en la grilla de la escena.
             * donde los números representan un espacio vacio, y las x representan un espacio
             * a pintar, para ser ocupado por una plataforma.
             * tener en cuenta que, para efectos de diseÃ±ar escenas, la grilla es de 32x32.
             */
            defaultPlan   : "4x56x96/4x65x69/4xxxx2xx3xx7x5x2/8xx4xx4xx5xx3/8888/4x56x96/" +
                            "4xxx3xxx2xx7x8/5xxx2xxxx2x7x5x2/8xx4xx4xx5xx3/8x788/8xx688/8xxx588/" +
                            "4xx1x2xxx1xx5x6xx2/4xx2xx4xx4xx5xx3/8888/4x56x96/4x56x96/"+
                            "4x56x96/8888/8885xxx/888xxx5/87x86xx4xx2/8888/8882xxx3/" +
                            "8888/8888/8888/8xx4xx4xx5xx3/5xxx2xxxx2x7x5x2/4xxx3xxx2xx7x8/" +
                            "8xx4xx4xx5xx3/8888/4x56x96/4xxxx2xx3xx7x5x2/4x56x96/4x65x69/"
         },
         //TODO encapsular componentes UI
        _canvas  = document.createElement("canvas"),
        _context = _canvas.getContext("2d"),
        _ui      = document.getElementById("ui"),

        _platforms = [],
        _balls     = [],
        _border    = new Border(_settings.colorPlatform, _context),
        _player    = new Player(_context, _canvas),
        //TODO encapsular propiedades relativas a teclado e interfaces.
        _rightPressed = false,
        _leftPressed  = false,
        _upPressed    = false,
        _downPressed  = false,
        _start,
        _state = State.running;


    function _keyDownHandler(e) {
        switch(e.keyCode) {
            case 39:
                _rightPressed = true;
                break;
            case 37:
                _leftPressed  = true;
                break;
            case 38:
                _upPressed    = true;
                break;
            case 40:
                _downPressed  = true;
                break;
            case 80:   //P    pause
                if (_state === State.pausing) {
                    _state = State.running;
                } else if (_state === State.running ) {
                    _state = State.pausing;
                }
                break;
            default:
                break;
        }
    }

    function _keyUpHandler(e) {
        switch(e.keyCode) {
            case 39:
                _rightPressed = false;
                break;
            case 37:
                _leftPressed  = false;
                break;
            case 38:
                _upPressed    = false;
                break;
            case 40:
                _downPressed  = false;
                break;
            default:
                break;
        }
    }

    function _generatePlatforms(plan) {

        plan.split("/").forEach(function(fila, indexOfFila){
            var x = 0;
            fila.split("").forEach(function(casilla){
                var xx = casilla * 1;
                if (!isNaN(xx)) {
                    x += xx * 16;
                } else {
                    var p = new RectSprite(_settings.colorPlatform, _context);
                    p.x = x;
                    p.y = indexOfFila * 8;
                    p.w = _settings.platformWidth;
                    p.h = _settings.platformHeight;
                    p.color = _settings.colorPlatform;
                    _platforms.push(p);
                }
            });
        });
    }

    /*
    DEPRECATED
    */
    function _generateBorder() {
        _border.h = _settings.height;
        _border.w = _settings.width;
    }

    function _drawPlatforms() {
        _platforms.forEach( function(platform){
            platform.draw();
        });
       // _border.draw();
    }

    function _drawBalls(context) {
        _balls.forEach(function(ball){
            ball.draw();
        });
    }

    /**
     * La factory posee la funcionalidad de "saber" dinámicamente
     * que tipo de bacteria generar.
     */
    function _ballFactory(){
        var balls = {
           "red"       : function(){
               var red = new RedBall(_context, _canvas);
               return red;
           },

           "green"    : function(){
                var green = new GreenBall(_context, _canvas);
                return green;
           },

           "orange"   : function() {
                var orange = new OrangeBall(_context, _canvas);
                return orange;
           }
        };

        //Cada 5 pelotas, generar una verde.
        if ((_balls.length +5) % 5 === 0) {
            return balls.green();
        }

        if (getRandomInt(1, 4) === 2) {
            return balls.orange();
        }

        return balls.red();
    }

    function _movePlayer() {
        if (_leftPressed && _player.x > 0) {
            _player.move.dx = -3;

        } else if (_rightPressed &&
                   _player.x + _player.w < _player.move.canvas.width ) {

            _player.move.dx = 3;
        } else {

            _player.move.dx = 0;
        }

        if (_upPressed &&
            _player.y > 0) {
            _player.move.dy = -3;

        } else if (_downPressed &&
                   _player.y + _player.h < _player.move.canvas.height) {
            _player.move.dy = 3;

        } else {
            _player.move.dy = 0;
        }
        //cacheamos la última ubicación del sprite player para volver a ellas
        //si al moverse entra en collision con alguna plataforma
        _player.lastX = _player.x;
        _player.lastY = _player.y;
        _player.x += _player.move.dx;
        _player.y += _player.move.dy;
    }

    function _init() {
        document.addEventListener("keydown", _keyDownHandler, false);
        document.addEventListener("keyup",   _keyUpHandler, false);

        _player.move.move =  _movePlayer;
        _canvas.height    = _settings.height;
        _canvas.width     = _settings.width;
        _parent.appendChild(_canvas);
       // _generateBorder();
        _generatePlatforms(_settings.defaultPlan);
        _balls.push( _ballFactory());
        _drawPlatforms();
        _drawBalls();
    }

    function _clearCanvas() {
        _context.clearRect(0, 0, _canvas.width, _canvas.height);
    }

    function _updateBalls() {
        _balls.forEach(function(ball){
            ball.move.move();
        });
    }

    function _updateUi(timeStamp, start) {
        _ui.innerHTML = "<span class='rem12 center mono text-white'>" +
                        _player.lives + " proteinas |" +
                        Math.floor(timeStamp/1000) + " segundos |" +
                        _balls.length + " bacterias</span>";
    }

    function _checkCollisions() {
        _balls.forEach(function(ball){
            ball.move.checkBorderCollision();
            _platforms.forEach( function(rectangle){
                ball.move.bounce(ball.move.checkRectSpriteCollision(rectangle));
            });

            var whereWasTheCollision = ball.move.checkRectSpriteCollision(_player);
            if (whereWasTheCollision != 0) {
                _player.lives -= 1;
                ball.move.bounce(whereWasTheCollision);
            }
        });

        _platforms.forEach(function(platform) {
		    if (_player.move.isCollisioning(platform)) {
			    _player.x = _player.lastX;
			    _player.y = _player.lastY;
			}
        });
    }

    function _update(timeStamp) {
        if (_state === State.running) {
            _updateBalls();
            _movePlayer();
            _clearCanvas();

            _updateUi(timeStamp, _start);

            _drawPlatforms();
            _drawBalls();
            _player.draw();

            _checkCollisions();
            _time += 1;
            if ((_time / 32 ) % 8 === 0) {
                _balls.push(_ballFactory());
            }

            if (_player.lives <= 0) {
                _state = State.ending;
                _updateUi(timeStamp, _start);
            }
        }

        if (_state === State.ending) {
            //TODO
        }
        window.requestAnimationFrame(_update);
    }

    function _loop() {
        window.requestAnimationFrame(_update);
    }

    return {
        init     : _init,
        gameLoop : _loop
    };
})();

window.onload = function() {
    Game.init();
    Game.gameLoop();
};
