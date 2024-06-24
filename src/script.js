import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as YUKA from 'yuka';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'
import { mix } from "three/examples/jsm/nodes/Nodes.js";

const canvas = document.querySelector("canvas.webgl");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color('white');

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
//camera.position.set(0,3,6);
camera.position.set(0,10,15);
scene.add(camera);


let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;


// Light
const ambientLight = new THREE.AmbientLight('white', 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight('white', 0.5);
//directionalLight.position.set(1,2,0);
directionalLight.position.set(0,10,10);
scene.add(directionalLight);

const moveDirection = new THREE.Vector3();
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();


const cubeTextureLoader=new THREE.CubeTextureLoader();

const enviromentMap=cubeTextureLoader.load([
  'textures/sea/px.png',
  'textures/sea/nx.png',
  'textures/sea/py.png',
  'textures/sea/ny.png',
  'textures/sea/pz.png',
  'textures/sea/nz.png',
]);
scene.enviromentMap=enviromentMap;
scene.background=enviromentMap;

const geometry = new THREE.SphereGeometry( 0.2, 32, 16 ); 
const material = new THREE.MeshBasicMaterial( {map: new THREE.TextureLoader().load('textures/sea1/hh.jpg'),side:THREE.DoubleSide});
const mesh = new THREE.Mesh( geometry, material );
mesh.scale.set(1000,1000,1000);
scene.add( mesh );


const entityManager = new YUKA.EntityManager();
const entityManager3 = new YUKA.EntityManager();
function sync(entity, renderComponent) {
  renderComponent.matrix.copy(entity.worldMatrix);
}

const loader=new GLTFLoader();
let mixer,mixer1;


const vehicleGeometry = new THREE.ConeBufferGeometry(0.1, 0.5, 8);
vehicleGeometry.rotateX(Math.PI * 0.5);
const vehicleMaterial = new THREE.MeshNormalMaterial();
const vehicleMesh = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
vehicleMesh.matrixAutoUpdate = false;

const vehicle1 = new YUKA.Vehicle();

vehicle1.setRenderComponent(vehicleMesh, sync);

const path = new YUKA.Path();
path.add( new YUKA.Vector3(-50, 0, 50));
path.add( new YUKA.Vector3(-60, 0, 0));
path.add( new YUKA.Vector3(-50, 0, -50));
path.add( new YUKA.Vector3(0, 0, 0));
path.add( new YUKA.Vector3(50, 0, -50));
path.add( new YUKA.Vector3(60, 0, 60));
path.add( new YUKA.Vector3(60, 0, 60));
path.add( new YUKA.Vector3(0, 0, 50));

path.loop = true;

vehicle1.position.copy(path.current());

//vehicle.maxSpeed = 3;

const followPathBehavior = new YUKA.FollowPathBehavior(path, 0.5);
vehicle1.steering.add(followPathBehavior);

const onPathBehavior = new YUKA.OnPathBehavior(path);
onPathBehavior.radius = 2;
vehicle1.steering.add(onPathBehavior);

const entityManager1 = new YUKA.EntityManager();
entityManager1.add(vehicle1);



let mixer2;
loader.load('model/shark/great_white_shark (1).glb',function(glb){
  const model=glb.scene;
  scene.add(model);
  mixer2=new THREE.AnimationMixer(model);
  const clips=glb.animations;
  clips.forEach(function(clip){
    const action=mixer2.clipAction(clip);
    action.play();
  });
  model.matrixAutoUpdate=false;
  vehicle1.scale=new YUKA.Vector3(15,15,15);
 // vehicle1.position=new YUKA.Vector3(10,10.2);
  vehicle1.setRenderComponent(model,sync);

});

loader.load('model/nimo/clown_fish.glb', function(glb){
  const model = glb.scene;
  const clips = glb.animations;
  const fishes = new THREE.AnimationObjectGroup();
  mixer = new THREE.AnimationMixer(fishes);
  const clip = THREE.AnimationClip.findByName(clips, 'Fish_001_animate_preview');
  const action = mixer.clipAction(clip);
  action.play();

  const alifnmentBehabior = new YUKA.AlignmentBehavior();
  alifnmentBehabior.weight = 2;

  const cohesionBehavior = new YUKA.CohesionBehavior();
  cohesionBehavior.weight = 2;
  const createFishPath = (startPosition) => {
    const targetPosition = new YUKA.Vector3(50, 0, 50); 
    const path = new YUKA.Path();
    path.add(startPosition);        
    path.add(targetPosition);       
    path.add(startPosition);        
    path.loop = true;             
    return path;
  };

  for (let i = 0; i < 30; i++) {
    const fishClone = SkeletonUtils.clone(model);
    fishClone.matrixAutoUpdate = false;
    scene.add(fishClone);
    fishes.add(fishClone);

    const vehicle = new YUKA.Vehicle();
    vehicle.setRenderComponent(fishClone, sync);
    vehicle.scale.set(0.005, 0.005, 0.005);

    const startPosition = new YUKA.Vector3(
      2.5 - Math.random() * 20,
      0, 
      2.5 - Math.random() * 20
    );

    const fishPath = createFishPath(startPosition);

    const followPathBehavior = new YUKA.FollowPathBehavior(fishPath, 2); 
    vehicle.steering.add(followPathBehavior);


    const wanderBehavior = new YUKA.WanderBehavior();
    vehicle.steering.add(wanderBehavior);
    wanderBehavior.weight = 0.1;

    vehicle.updateNeighborhood = true;
    vehicle.neighborhoodRadius = 10;

    vehicle.steering.add(alifnmentBehabior);
    // vehicle.steering.add(cohesionBehavior);
    // vehicle.steering.add(separationBehavior);

    entityManager.add(vehicle);

    vehicle.position.copy(startPosition);
    vehicle.rotation.fromEuler(0, 2 * Math.PI * Math.random(), 0);
  }
});


loader.load('model/shark/swimming_shark__animated.glb',function(glb){
  const model=glb.scene;
  scene.add(model);
  model.position.set(100,0,0);
  model.scale.set(3,3,3)
  mixer1=new THREE.AnimationMixer(model);
  const clips=glb.animations;
  /*const clip = THREE.AnimationClip.findByName(clips,'Bite');
  const action=mixer.clipAction(clip);
  action.play();*/
  clips.forEach(function(clip){
    const action=mixer1.clipAction(clip);
    action.play();
  });

});

let mixer4;
loader.load('model/fish/guppy_fish.glb',function(glb){
  const model=glb.scene;
  const clips=glb.animations;
  const fishes=new THREE.AnimationObjectGroup();
  mixer4=new THREE.AnimationMixer(fishes);
  clips.forEach(function(clip){
    const action=mixer4.clipAction(clip);
    action.play();
  });

  const alifnmentBehabior=new YUKA.AlignmentBehavior();
  alifnmentBehabior.weight=2;

  const cohesionBehavior = new YUKA.CohesionBehavior();
  cohesionBehavior.weight=0.5;

  const separationBehavior=new YUKA.SeparationBehavior();
  separationBehavior.weight=20;

  for(let i=0;i<20;i++){
   // const vehicleMesh = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
    const fishClone=SkeletonUtils.clone(model);
    fishClone.matrixAutoUpdate=false;
    scene.add(fishClone);
    fishes.add(fishClone);

  
    const vehicle = new YUKA.Vehicle();
    vehicle.setRenderComponent(fishClone, sync);
    vehicle.scale.set(0.5,0.5,0.5);
    vehicle.position.x = -50 + Math.random() * 20; //  تبدأ  من  اليسار
  vehicle.position.z = 2.5 - Math.random() * 20; 
  vehicle.rotation.fromEuler(0, 2 * Math.PI * Math.random(), 0); 
    const wanderBehavior=new YUKA.WanderBehavior();
    vehicle.steering.add(wanderBehavior);
    wanderBehavior.weight=0.5;

    vehicle.updateNeighborhood=true;
    vehicle.neighborhoodRadius=10;

    vehicle.steering.add(alifnmentBehabior);
    vehicle.steering.add(cohesionBehavior);
    vehicle.steering.add(separationBehavior);

    entityManager3.add(vehicle);
  
    vehicle.position.x=2.5-Math.random()*20;
    vehicle.position.z=2.5-Math.random()*20;
    vehicle.rotation.fromEuler(0,2*Math.PI*Math.random(),0);
  
  }
});

let mixer3;
/*loader.load('model/fish/model_46a_-_subadult_green_sea_turtle.glb',function(glb){
  const model=glb.scene;
  scene.add(model);
  mixer3=new THREE.AnimationMixer(model);
  const clips=glb.animations;
  clips.forEach(function(clip){
    const action=mixer3.clipAction(clip);
    action.play();
  });

});*/

const time = new YUKA.Time();

// Draw
const clock = new THREE.Clock();

function onKeyDown(event) {
  switch (event.keyCode) {
    case 87: // W
      moveForward = true;
      break;
    case 65: // A
      moveLeft = true;
      break;
    case 83: // S
      moveBackward = true;
      break;
    case 68: // D
      moveRight = true;
      break;
  }
}
function onKeyUp(event) {
  switch (event.keyCode) {
    case 87: // W
      moveForward = false;
      break;
    case 65: // A
      moveLeft = false;
      break;
    case 83: // S
      moveBackward = false;
      break;
    case 68: // D
      moveRight = false;
      break;
  }
}

function draw() {
  const delta = clock.getDelta();
  if(mixer){
    mixer.update(delta);
  }
  if(mixer1){
    mixer1.update(delta);
  }
  if(mixer2){
    mixer2.update(delta);
  }
  /*if(mixer3){
    mixer3.update(delta);
  }*/
  if(mixer4){
    mixer4.update(delta);
  }
 
  entityManager.update(delta);
  entityManager1.update(delta);
  entityManager3.update(delta);




  if (moveForward) camera.translateZ(-10 * delta);
  if (moveBackward) camera.translateZ(10 * delta);
  if (moveLeft) camera.translateX(-10 * delta);
  if (moveRight) camera.translateX(10 * delta);
  
  renderer.render(scene, camera);
  renderer.setAnimationLoop(draw);
}

function setSize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}



// Event
window.addEventListener('resize', setSize);
document.addEventListener('keydown', onKeyDown, false);
document.addEventListener('keyup', onKeyUp, false);


draw();