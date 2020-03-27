import GameObject = Phaser.GameObjects.GameObject;

class ColonySimulator {

    game: Phaser.Game;

    gameConfig: Phaser.Types.Core.GameConfig = {
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
                gravity: { y: 0}
            },
        },
        scene: GameScene
    }


    constructor() {
        this.game = new Phaser.Game(this.gameConfig)
    }


    preload() {

    }

    create() {

    }
}

class GameScene extends Phaser.Scene {

    colonies: Array<Colony> = new Array<Colony>()
    map: Phaser.Tilemaps.Tilemap;
    tileset: Phaser.Tilemaps.Tileset;
    groundLayer: Phaser.Tilemaps.StaticTilemapLayer;

    constructor() {
        super({
            active: false,
            visible: false,
            key: "Game"
        });
    }

    preload(){
        this.load
            .tilemapTiledJSON('map', 'assets/tiles/maps/ants.json')
            .image('Desert', 'assets/tiles/tmw_desert_spacing.png')
            .atlas('ants', 'assets/tiles/ant/ants.png', 'assets/tiles/ant/ants.json')
    }

    public create(){
        this.map = this.make.tilemap({key: 'map'});
        this.tileset = this.map.addTilesetImage('Desert');
        this.groundLayer = this.map.createStaticLayer('groundLayer', this.tileset, 0, 0);
        this.map.setCollision([31,32,38,39,40,46,47,48]); //, 31, 37, 38, 39, 45, 46, 47

        this.anims.create({
            key: 'ant_animation',
            repeat: -1,
            frameRate: 8,
            frames: this.anims.generateFrameNames('ants', {start: 4, end: 7, prefix: "ant-"})
        });
        this.colonies.push(new Colony(this, 500, 500));
        this.time.delayedCall(5000, this.spawnNewAnts, [], this );
        this.physics.world.on('worldbounds', this.onWorldCollide , this);

    }

    public onWorldCollide(body: Phaser.Physics.Arcade.Body){
        let ant = <Ant>body.gameObject;
        ant.changeDirection();
    }

    public update(time: number, delta: number){
        this.colonies.forEach (function(colony){
            colony.update(time, delta)
        })
    }

    spawnNewAnts(){
        this.colonies.forEach (function(colony){
            colony.spawn();
        });
        this.time.delayedCall(5000, this.spawnNewAnts, [], this );
    }


}

class Colony {

    ants: Array<Ant> = new Array<Ant>();
    scene: GameScene;
    foodSupply: number = 100;

    constructor(scene: GameScene, x: number, y: number) {
        this.scene = scene;
        this.createAnt();
    }

    update(time: number, delta: number) {
        this.ants.forEach (function(ant){
            ant.update(time, delta)
        })
    }

    private createAnt(){
        this.foodSupply-=10;
        this.ants.push(new Ant(this.scene, this.randomX(), this.randomY(), 'ants', new Phaser.Geom.Point(this.randomX(), this.randomY())));
    }

    spawn(){
        if(this.foodSupply >= 10){
            this.createAnt();
        }
    }

    randomX() : number {
        return Math.floor(Math.random() * 240) + 560
    }

    randomY() : number {
        return Math.floor(Math.random() * 80) + 840
    }

}

class Ant extends Phaser.GameObjects.Sprite {
    isFirst = true;
    body: Phaser.Physics.Arcade.Body;
    target: Phaser.Geom.Point;
    speed: number = 45;
    antState: AntState;
    degreesToRotate: number = 0;

    constructor(scene: GameScene, x: number, y: number, key: string, target: Phaser.Geom.Point) {
        super(scene, x, y, key);
        this.antState = AntState.FORAGING;
        this.target = target;
        this.scene.physics.world.enable(this);
        this.scene.add.existing(this);
        let angle = Phaser.Math.Angle.BetweenPoints(this, target);
        this.rotation = angle;
        this.body.setVelocityX(Math.cos(angle)*this.speed);
        this.body.setVelocityY(Math.sin(angle)*this.speed);
        this.body.setCollideWorldBounds(true);
        this.body.onWorldBounds = true;
        scene.physics.add.collider(this, scene.groundLayer, function()  {
            console.log("I hit something");
        });
    }


    firstUpdate(): void {
        this.anims.play("ant_animation");
        this.isFirst = false;
    }


    update(time: number, delta: number) {
        if (this.isFirst) {
            this.firstUpdate();
        }
        if(this.antState == AntState.ROTATING){
            if(this.degreesToRotate >= 0){
                this.degreesToRotate -= 0.5;
                this.angle -= 0.5;
            }else {
                this.antState = AntState.FORAGING;
                this.body.setVelocityX(Math.cos(this.body.rotation)*this.speed);
                this.body.setVelocityY(Math.sin(this.body.rotation)*this.speed);
            }
        }

    }


    public changeDirection() {
        let rnd = Phaser.Math.DegToRad(Phaser.Math.RND.between(-45, 45));
        this.rotation =  Phaser.Math.Angle.Reverse(this.rotation)+rnd;
        this.body.setVelocityX(Math.cos(this.rotation)*this.speed);
        this.body.setVelocityY(Math.sin(this.rotation)*this.speed);
    }

}

enum AntState {
    FORAGING, ROTATING
}

window.onload = () => {
    let game = new ColonySimulator();
}