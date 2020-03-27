var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var GameObject = Phaser.GameObjects.GameObject;
var ColonySimulator = /** @class */ (function () {
    function ColonySimulator() {
        this.gameConfig = {
            title: "Colony Simulator",
            type: Phaser.AUTO,
            scale: {
                width: 1280,
                height: 960
            },
            backgroundColor: '#000000',
            parent: "game",
            physics: {
                default: 'arcade',
                arcade: {
                    debug: true,
                    gravity: { y: 0 }
                },
            },
            scene: GameScene
        };
        this.game = new Phaser.Game(this.gameConfig);
    }
    ColonySimulator.prototype.preload = function () {
    };
    ColonySimulator.prototype.create = function () {
    };
    return ColonySimulator;
}());
var GameScene = /** @class */ (function (_super) {
    __extends(GameScene, _super);
    function GameScene() {
        var _this = _super.call(this, {
            active: false,
            visible: false,
            key: "Game"
        }) || this;
        _this.colonies = new Array();
        return _this;
    }
    GameScene.prototype.preload = function () {
        this.load
            .tilemapTiledJSON('map', 'assets/tiles/maps/ants.json')
            .image('Desert', 'assets/tiles/tmw_desert_spacing.png')
            .atlas('ants', 'assets/tiles/ant/ants.png', 'assets/tiles/ant/ants.json');
    };
    GameScene.prototype.create = function () {
        this.map = this.make.tilemap({ key: 'map' });
        this.tileset = this.map.addTilesetImage('Desert');
        this.groundLayer = this.map.createStaticLayer('groundLayer', this.tileset, 0, 0);
        this.map.setCollision([31, 32, 38, 39, 40, 46, 47, 48]); //, 31, 37, 38, 39, 45, 46, 47
        this.anims.create({
            key: 'ant_animation',
            repeat: -1,
            frameRate: 8,
            frames: this.anims.generateFrameNames('ants', { start: 4, end: 7, prefix: "ant-" })
        });
        this.colonies.push(new Colony(this, 500, 500));
        this.time.delayedCall(5000, this.spawnNewAnts, [], this);
        this.physics.world.on('worldbounds', this.onWorldCollide, this);
    };
    GameScene.prototype.onWorldCollide = function (body) {
        var ant = body.gameObject;
        ant.changeDirection();
    };
    GameScene.prototype.update = function (time, delta) {
        this.colonies.forEach(function (colony) {
            colony.update(time, delta);
        });
    };
    GameScene.prototype.spawnNewAnts = function () {
        this.colonies.forEach(function (colony) {
            colony.spawn();
        });
        this.time.delayedCall(5000, this.spawnNewAnts, [], this);
    };
    return GameScene;
}(Phaser.Scene));
var Colony = /** @class */ (function () {
    function Colony(scene, x, y) {
        this.ants = new Array();
        this.foodSupply = 100;
        this.scene = scene;
        this.createAnt();
    }
    Colony.prototype.update = function (time, delta) {
        this.ants.forEach(function (ant) {
            ant.update(time, delta);
        });
    };
    Colony.prototype.createAnt = function () {
        this.foodSupply -= 10;
        this.ants.push(new Ant(this.scene, this.randomX(), this.randomY(), 'ants', new Phaser.Geom.Point(this.randomX(), this.randomY())));
    };
    Colony.prototype.spawn = function () {
        if (this.foodSupply >= 10) {
            this.createAnt();
        }
    };
    Colony.prototype.randomX = function () {
        return Math.floor(Math.random() * 240) + 560;
    };
    Colony.prototype.randomY = function () {
        return Math.floor(Math.random() * 80) + 840;
    };
    return Colony;
}());
var Ant = /** @class */ (function (_super) {
    __extends(Ant, _super);
    function Ant(scene, x, y, key, target) {
        var _this = _super.call(this, scene, x, y, key) || this;
        _this.isFirst = true;
        _this.speed = 45;
        _this.degreesToRotate = 0;
        _this.antState = AntState.FORAGING;
        _this.target = target;
        _this.scene.physics.world.enable(_this);
        _this.scene.add.existing(_this);
        var angle = Phaser.Math.Angle.BetweenPoints(_this, target);
        _this.rotation = angle;
        _this.body.setVelocityX(Math.cos(angle) * _this.speed);
        _this.body.setVelocityY(Math.sin(angle) * _this.speed);
        _this.body.setCollideWorldBounds(true);
        _this.body.onWorldBounds = true;
        scene.physics.add.collider(_this, scene.groundLayer, function () {
            console.log("I hit something");
        });
        return _this;
    }
    Ant.prototype.firstUpdate = function () {
        this.anims.play("ant_animation");
        this.isFirst = false;
    };
    Ant.prototype.update = function (time, delta) {
        if (this.isFirst) {
            this.firstUpdate();
        }
        if (this.antState == AntState.ROTATING) {
            if (this.degreesToRotate >= 0) {
                this.degreesToRotate -= 0.5;
                this.angle -= 0.5;
            }
            else {
                this.antState = AntState.FORAGING;
                this.body.setVelocityX(Math.cos(this.body.rotation) * this.speed);
                this.body.setVelocityY(Math.sin(this.body.rotation) * this.speed);
            }
        }
    };
    Ant.prototype.changeDirection = function () {
        var rnd = Phaser.Math.DegToRad(Phaser.Math.RND.between(-45, 45));
        this.rotation = Phaser.Math.Angle.Reverse(this.rotation) + rnd;
        this.body.setVelocityX(Math.cos(this.rotation) * this.speed);
        this.body.setVelocityY(Math.sin(this.rotation) * this.speed);
    };
    return Ant;
}(Phaser.GameObjects.Sprite));
var AntState;
(function (AntState) {
    AntState[AntState["FORAGING"] = 0] = "FORAGING";
    AntState[AntState["ROTATING"] = 1] = "ROTATING";
})(AntState || (AntState = {}));
window.onload = function () {
    var game = new ColonySimulator();
};
//# sourceMappingURL=app.js.map