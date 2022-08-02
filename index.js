import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useFrame, useCleanup, usePhysics, useApp} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');
const texBase = 'Vol_52_2';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localTriangle = new THREE.Triangle();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

export default () => {
  const app = useApp();
  const physics = usePhysics();

  // ### CubeGeometry
  
  const size = new THREE.Vector3(2, 1, 1);
  const geometry = new THREE.BoxBufferGeometry(size.x, size.y, size.z);
  const indices = geometry.index.array;
  const positions = geometry.attributes.position.array;
  const uvs = geometry.attributes.uv.array;
  const indicesSeen = {};
  for (let i = 0; i < indices.length; i += 3) {
    const ai = indices[i];
    const bi = indices[i+1];
    const ci = indices[i+2];
    localTriangle.set(
      localVector.fromArray(positions, ai*3),
      localVector2.fromArray(positions, bi*3),
      localVector3.fromArray(positions, ci*3)
    ).getNormal(localVector4);
    if (Math.abs(localVector4.y) > 0.5 || Math.abs(localVector4.z) > 0.5) {
      if (!indicesSeen[ai]) {
        uvs[ai*2] *= size.x;
        indicesSeen[ai] = true;
      }
      if (!indicesSeen[bi]) {
        uvs[bi*2] *= size.x;
        indicesSeen[bi] = true;
      }
      if (!indicesSeen[ci]) {
        uvs[ci*2] *= size.x;
        indicesSeen[ci] = true;
      }
    }
  }

  const urls = [
    baseUrl + texBase + '_Base_Color.png',
    baseUrl + texBase + '_Normal.png',
    baseUrl + texBase + '_Height.png'
  ];
  var maps = {};
  const promises = urls.map(url => {
    return new Promise((resolve) => {
      const map = new THREE.Texture();
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      {
        const img = new Image();
        img.onload = () => {
          map.image = img;
          map.needsUpdate = true;
          resolve();
        };
        img.onerror = err => {
          console.warn(err);
        };
        img.crossOrigin = 'Anonymous';
        img.src = url;
      }
      maps[url] = map;
    })
  });
  const map = maps[urls[0]];
  const normalMap = maps[urls[1]];
  const bumpMap = maps[urls[2]];

  const material = new THREE.MeshStandardMaterial({
    // color: 0x00b2fc,
    // specular: 0x00ffff,
    // shininess: 20,
    map,
    normalMap,
    bumpMap,
    roughness: 1,
    metalness: 0,
  });
  const physicsCube = new THREE.Mesh(geometry, material);
  app.add(physicsCube);
  
  physicsCube.visible = false;
  Promise.all(promises)
    .then(() => {
      physicsCube.visible = true;
    }).catch((e) => {
    });

  const physicsObject = physics.addBoxGeometry(app.position, app.quaternion, size.clone().multiplyScalar(0.5), true);

  // ### ConeGeometry

  // const geometry = new THREE.ConeGeometry( 2, 5, 3 );
  // const material = new THREE.MeshStandardMaterial( {color: 0xffff00} );
  // const physicsCube = new THREE.Mesh( geometry, material );
  // app.add( physicsCube );

  // const physicsObject = physics.addConvexGeometry(physicsCube);

  //

  useFrame(({ timestamp }) => {
    // ! Bellow Code Has Bugs XXX
    // if ((updateIndex % 300) === 0) {
    //   // console.log('reset pos 1', physicsObject.position.toArray().join(','));
    //   physicsObject.position.copy(app.position).add(p);
    //   physicsObject.quaternion.copy(app.quaternion).premultiply(q);
    //   // physicsObject.physicsMesh.scale.copy(s);
    //   physicsObject.updateMatrixWorld();
    //   physicsObject.needsUpdate = true;
    //   // physics.setPhysicsTransform(physicsCubePhysicsId, p, q, s);
    //   // const {position, quaternion} = physics.getPhysicsTransform(physicsCubePhysicsId);
    // }
    // ! Above Code Has Bugs XXX

    // console.log('tick pos 1', physicsCube.position.toArray().join(','));
    // const {position, quaternion} = physics.getPhysicsTransform(physicsCubePhysicsId);
    physicsObject.updateMatrixWorld();
    localMatrix
      .copy(physicsObject.matrixWorld)
      .premultiply(localMatrix2.copy(app.matrixWorld).invert())
      .decompose(
        physicsCube.position,
        physicsCube.quaternion,
        physicsCube.scale
      );
    // console.log('position', physicsObject.position.toArray().join(','), physicsCube.position.toArray().join(','));
    app.updateMatrixWorld();
    // physicsCube.updateMatrixWorld();
    // updateIndex++;
  });

  useCleanup(() => {
    // console.log('cleanup 1');
    physics.removeGeometry(physicsObject);
  });
  
  return app;
};

/* console_test
  metaversefileApi.getPairByPhysicsId(1)

  rootScene.traverse(child=>{
    if(child.contentId?.includes('physicscube')) {
  console.log(child)
  window.physicscubeApp=child
    }
  })

  physicscube.children[0].visible=false

  metaversefileApi.getPairByPhysicsId(1)[1] === physicscube
  false

  metaversefileApi.getPairByPhysicsId(1)[1] === physicscube.physicsObjects[0]
  true

  physicscube.physicsObjects[0].physicsMesh === physicscube.children[0]
  false

  metaversefileApi.getPairByPhysicsId(1)[0] === physicscube
  true

  physicsManager.getScene().setVelocity(physicscubeApp.physicsObjects[0],new THREE.Vector3(0,15,0),true)
  physicsManager.getScene().setAngularVelocity(physicscubeApp.physicsObjects[0],new THREE.Vector3(1,2,3),true)
*/