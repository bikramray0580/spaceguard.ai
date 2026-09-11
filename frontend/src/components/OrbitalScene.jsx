import { Html, OrbitControls, Stars } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
const colors = {
  normal: '#b7d7ff',
  elevated: '#e5a25c',
  critical: '#ef604e',
}

const axis = new THREE.Vector3(1, 0, 0)

const at = (object, angle) =>
  new THREE.Vector3(
    Math.cos(angle) * object.radius,
    0,
    Math.sin(angle) * object.radius,
  ).applyAxisAngle(axis, object.inclination)

function createNightEarthTexture() {
  const canvas = document.createElement('canvas')

  canvas.width = 1024
  canvas.height = 512

  const context = canvas.getContext('2d')

  const ocean = context.createLinearGradient(
    0,
    0,
    1024,
    512,
  )

  ocean.addColorStop(0, '#0a2944')
  ocean.addColorStop(0.44, '#16708a')
  ocean.addColorStop(0.74, '#0a3d61')
  ocean.addColorStop(1, '#061a32')

  context.fillStyle = ocean
  context.fillRect(0, 0, 1024, 512)

  context.strokeStyle = 'rgba(132, 224, 220, 0.12)'
  context.lineWidth = 1

  for (
    let latitude = 48;
    latitude < 512;
    latitude += 52
  ) {
    context.beginPath()
    context.moveTo(0, latitude)

    context.bezierCurveTo(
      240,
      latitude - 18,
      700,
      latitude + 20,
      1024,
      latitude - 5,
    )

    context.stroke()
  }

  const land = [
    '#1b755e',
    '#32865e',
    '#21654e',
    '#3b8e62',
  ]

  const continents = [
    [170, 136, 144, 86],
    [382, 120, 168, 80],
    [566, 234, 164, 96],
    [792, 150, 136, 76],
    [274, 316, 96, 62],
  ]

  continents.forEach(
    ([x, y, width, height], index) => {
      context.save()

      context.translate(x, y)

      context.rotate(
        index % 2 ? -0.24 : 0.2,
      )

      context.fillStyle =
        land[index % land.length]

      context.beginPath()

      context.ellipse(
        0,
        0,
        width,
        height,
        0,
        0,
        Math.PI * 2,
      )

      context.fill()

      context.strokeStyle =
        'rgba(151, 231, 163, 0.32)'

      context.lineWidth = 2
      context.stroke()

      context.fillStyle =
        'rgba(220, 245, 175, 0.36)'

      for (let dot = 0; dot < 18; dot += 1) {
        context.fillRect(
          Math.sin(dot * 5.2) * width * 0.7,
          Math.cos(dot * 3.7) * height * 0.65,
          3,
          2,
        )
      }

      context.restore()
    },
  )

  const texture = new THREE.CanvasTexture(canvas)

  texture.colorSpace = THREE.SRGBColorSpace

  return texture
}

function Earth() {
  const cloudRef = useRef()
  const earthMaterial = useMemo(() => new THREE.ShaderMaterial({ uniforms:{sun:{value:new THREE.Vector3(1.2,.65,1).normalize()}}, vertexShader:`varying vec2 u;varying vec3 n;void main(){u=uv;n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`, fragmentShader:`varying vec2 u;varying vec3 n;uniform vec3 sun;float h(vec2 p){return fract(sin(dot(p,vec2(41.7,289.3)))*43758.5);}float no(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}float fb(vec2 p){float v=0.;for(int i=0;i<5;i++){v+=no(p)*.5;p=p*2.02+4.7;}return v;}float b(vec2 p,vec2 c,vec2 r){vec2 d=(p-c)/r;return 1.-smoothstep(.48,1.12,dot(d,d));}void main(){vec2 p=vec2(fract(u.x+.04),u.y);float masses=max(max(b(p,vec2(.55,.58),vec2(.15,.19)),b(p,vec2(.71,.66),vec2(.24,.12))),max(b(p,vec2(.25,.53),vec2(.1,.21)),b(p,vec2(.44,.31),vec2(.08,.16))));float land=smoothstep(.43,.62,masses+(fb(p*8.)-.5)*.52);float relief=fb(p*34.);vec3 ocean=vec3(.006,.018,.052)+vec3(.012,.038,.09)*relief;vec3 ground=mix(vec3(.035,.065,.055),vec3(.19,.15,.09),relief);vec3 base=mix(ocean,ground,land);float nd=max(dot(normalize(n),sun),0.);float night=smoothstep(.27,-.22,dot(normalize(n),sun));float cities=step(.985,h(floor(p*vec2(220.,120.))))*land*night;vec3 color=base*(.035+.95*nd)+vec3(1.,.38,.08)*cities*.8;gl_FragColor=vec4(color,1.);}`}), [])
  const cloudMaterial = useMemo(() => new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0}},vertexShader:`varying vec2 u;void main(){u=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 u;uniform float time;float h(vec2 p){return fract(sin(dot(p,vec2(12.3,77.1)))*43758.5);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}void main(){float c=smoothstep(.73,.85,n(vec2(u.x*10.+time*.003,u.y*17.)));gl_FragColor=vec4(vec3(.55,.68,.78),c*.13);}`}), [])
  // Final albedo calibration: cooler oceans, desaturated vegetation, and sparse urban emission.
  // Kept as shader text so the Earth remains fully procedural and editable.
  earthMaterial.fragmentShader = earthMaterial.fragmentShader
    .replace('vec3 ocean=vec3(.006,.018,.052)+vec3(.012,.038,.09)*relief;', 'vec3 ocean=mix(vec3(.003,.012,.038),vec3(.018,.075,.15),relief);')
    .replace('vec3 ground=mix(vec3(.035,.065,.055),vec3(.19,.15,.09),relief);', 'vec3 ground=mix(vec3(.018,.055,.035),vec3(.105,.115,.062),relief);')
    .replace('float night=smoothstep(.27,-.22,dot(normalize(n),sun));', 'float night=smoothstep(.38,-.28,dot(normalize(n),sun));')
    .replace('step(.985,h(floor(p*vec2(220.,120.))))', 'step(.994,h(floor(p*vec2(260.,140.))))')
  earthMaterial.needsUpdate = true
  useFrame(({clock})=>{if(cloudRef.current)cloudRef.current.material.uniforms.time.value=clock.getElapsedTime()})
  return <group rotation={[.08,-.45,.12]}><mesh><sphereGeometry args={[1.72,128,96]}/><primitive object={earthMaterial} attach="material"/></mesh><mesh ref={cloudRef} scale={1.008}><sphereGeometry args={[1.72,128,96]}/><primitive object={cloudMaterial} attach="material"/></mesh><mesh scale={1.035}><sphereGeometry args={[1.72,128,96]}/><shaderMaterial transparent depthWrite={false} side={THREE.BackSide} blending={THREE.AdditiveBlending} vertexShader="varying vec3 n;varying vec3 v;void main(){n=normalize(normalMatrix*normal);v=normalize((modelViewMatrix*vec4(position,1.)).xyz);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}" fragmentShader="varying vec3 n;varying vec3 v;void main(){float r=pow(1.-abs(dot(n,-v)),4.6);gl_FragColor=vec4(vec3(.08,.34,.82)*r,r*.48);}"/></mesh></group>
}

function getInterpolatedPosition(orbit, progress) {
  const states = orbit?.states ?? []

  if (!states.length) return new THREE.Vector3()
  if (states.length === 1) {
    return new THREE.Vector3(...states[0].renderPosition)
  }

  const scaledIndex = progress * (states.length - 1)
  const lowerIndex = Math.floor(scaledIndex)
  const upperIndex = Math.min(lowerIndex + 1, states.length - 1)
  const localProgress = scaledIndex - lowerIndex

  const start = new THREE.Vector3(
    ...states[lowerIndex].renderPosition,
  )
  const end = new THREE.Vector3(
    ...states[upperIndex].renderPosition,
  )

  return start.lerp(end, localProgress)
}

function OrbitPath({ orbit, active }) {
  const points = useMemo(
    () =>
      orbit.states.map(
        (state) =>
          new THREE.Vector3(
            ...state.renderPosition,
          ),
      ),
    [orbit.states],
  )

  const positions = useMemo(
    () =>
      new Float32Array(
        points.flatMap((point) => point.toArray()),
      ),
    [points],
  )

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>

      <lineBasicMaterial
        color={active ? '#68e4f3' : '#3f78ac'}
        transparent
        opacity={active ? 0.58 : 0.16}
      />
    </line>
  )
}

function Marker({
  orbit,
  active,
  onSelect,
}) {
  const ref = useRef()
  const halo = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame(({ clock }) => {
    if (!ref.current || !orbit.states.length) return

    const cycle =
      (clock.getElapsedTime() % 96) / 96

    ref.current.position.copy(
      getInterpolatedPosition(orbit, cycle),
    )

    if (halo.current) {
      const pulse =
        active
          ? 1.5 + Math.sin(clock.getElapsedTime() * 3) * 0.16
          : 1

      halo.current.scale.setScalar(pulse)
    }
  })

  const visibleLabel = active || hovered

  return (
    <group ref={ref}>
      <mesh
        onClick={(event) => {
          event.stopPropagation()
          onSelect(orbit.id)
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry
          args={[active ? 0.075 : 0.038, 14, 14]}
        />
        <meshBasicMaterial
          color={active ? '#72ebf5' : '#8eafd4'}
        />
      </mesh>

      {active && (
        <mesh ref={halo}>
          <sphereGeometry args={[0.12, 14, 14]} />
          <meshBasicMaterial
            color="#72ebf5"
            transparent
            opacity={0.28}
          />
        </mesh>
      )}

      {visibleLabel && (
        <Html
          distanceFactor={11}
          center
          style={{ pointerEvents: 'none' }}
        >
          <span className="orbital-label">
            {orbit.name}
          </span>
        </Html>
      )}
    </group>
  )
}

function Scene({
  orbits = [],
  selectedObjectId,
  onObjectSelect,
}) {
  return (
    <>
      <color
        attach="background"
        args={['#050d1a']}
      />

      <fog
        attach="fog"
        args={['#050d1a', 14, 25]}
      />

      <ambientLight intensity={0.52} />

      <hemisphereLight
        args={['#71e5ed', '#071725', 0.62]}
      />

      <Stars
        radius={30}
        depth={14}
        count={720}
        factor={1.45}
        saturation={0}
        fade
        speed={0.12}
      />

      <Earth />

      {orbits.map((orbit) => (
        <OrbitPath
          key={`path-${orbit.id}`}
          orbit={orbit}
          active={orbit.id === selectedObjectId}
        />
      ))}

      {orbits.map((orbit) => (
        <Marker
          key={orbit.id}
          orbit={orbit}
          active={orbit.id === selectedObjectId}
          onSelect={onObjectSelect}
        />
      ))}

      <OrbitControls
        makeDefault
        enableRotate
        enableZoom
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={6.5}
        maxDistance={13}
        minPolarAngle={0.55}
        maxPolarAngle={2.45}
        autoRotate
        autoRotateSpeed={0.15}
      />
    </>
  )
}

export default function OrbitalScene(props) {
  return (
    <Canvas
      className="orbital-canvas-root"
      camera={{
        position: [6.1, 4.5, 6.9],
        fov: 38,
      }}
      dpr={[1, 1.7]}
    >
      <Scene {...props} />
    </Canvas>
  )
}
