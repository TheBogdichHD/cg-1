"use strict";

const vertexShaderSource = `#version 300 es

in vec2 a_position;

uniform mat3 u_matrix;

out vec2 v_position;

void main() {
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
  gl_PointSize = 3.0;
  v_position = a_position;
}
`;

const fragmentShaderSource = `#version 300 es

precision highp float;

in vec2 v_position;

uniform bool u_showStripes;

uniform vec4 u_color;

out vec4 outColor;

void main() {
  vec2 uv = v_position / 100.0;
  vec3 color = u_color.rgb;
  
  if (u_showStripes) {
    float stripe = step(0.5, fract(uv.x * 5.0));
    color = mix(vec3(0,0,0), vec3(0,1,1), stripe);
  }
  
  outColor = vec4(color, u_color.a);
}
`;

const vertexShaderSource2 = `#version 300 es

in vec4 a_position;

uniform mat4 u_matrix;

void main() {
  gl_Position = u_matrix * a_position;
}
`;

const fragmentShaderSource2 = `#version 300 es

precision highp float;

out vec4 outColor;

void main() {
  outColor = vec4(1, 1, 0, 1);
}
`;
function main() {
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");

  /** @type {WebGL2RenderingContext} */
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  const textCanvas = document.querySelector("#text");
  const ctx = textCanvas.getContext("2d");

  const program = webglUtils.createProgramFromSources(gl, [
    vertexShaderSource,
    fragmentShaderSource,
  ]);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  const colorLocation = gl.getUniformLocation(program, "u_color");
  const matrixLocation = gl.getUniformLocation(program, "u_matrix");
  const showStripesLocation = gl.getUniformLocation(program, "u_showStripes");


  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttributeLocation);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  const origin = [200, 80];

  drawScene();

  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    webglUtils.resizeCanvasToDisplaySize(ctx.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    gl.bindVertexArray(vao);

    const primitiveTypes = [
      gl.LINES,
      gl.LINE_STRIP,
      gl.LINE_LOOP,
      gl.TRIANGLES,
      gl.TRIANGLE_STRIP,
      gl.TRIANGLE_FAN,

      gl.POINTS,
      gl.POLYGON,
      gl.QUADS,
      gl.QUAD_STRIP,
    ];

    const primitiveNames = [
      "LINES",
      "LINE_STRIP",
      "LINE_LOOP",
      "TRIANGLES",
      "TRIANGLE_STRIP",
      "TRIANGLE_FAN",

      "POINTS",
      "POLYGON",
      "QUADS",
      "QUAD_STRIP",
    ];

    // Triangle
    setTriangleGeometry(gl);
    gl.uniform4fv(colorLocation, [
      Math.random(),
      Math.random(),
      Math.random(),
      1,
    ]);

    let matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
    matrix = m3.translate(matrix, 50, origin[1]);
    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Square
    setSquareGeometry(gl);

    gl.uniform4fv(colorLocation, [
      Math.random(),
      Math.random(),
      Math.random(),
      1,
    ]);

    matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
    matrix = m3.translate(matrix, 50, origin[1] + 250);
    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Fs
    setFGeometry(gl);

    for (let i = 0; i < 10; ++i) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = origin[0] + col * 150;
      const y = origin[1] + row * 250;

      const pixelX = (x * gl.canvas.width) / gl.canvas.clientWidth;
      const pixelY = (y * gl.canvas.height) / gl.canvas.clientHeight;

      const color = [Math.random(), Math.random(), Math.random(), 1];
      gl.uniform4fv(colorLocation, color);

      let matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
      matrix = m3.translate(matrix, x, y);

      gl.uniformMatrix3fv(matrixLocation, false, matrix);

      gl.drawArrays(primitiveTypes[i], 0, 18);

      ctx.save();
      ctx.translate(pixelX, pixelY);
      ctx.fillText(primitiveNames[i], 0, -10);
      ctx.restore();
    }

    // Pentagon
    setPentagonGeometry(gl);

    gl.uniform4fv(colorLocation, [1, 0, 0, 1,]);

    matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
    matrix = m3.translate(matrix, 100, origin[1] + 520);
    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 5);

    // Striped Square
    gl.uniform1i(showStripesLocation, 1);
    setSquareGeometry(gl);

    matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
    matrix = m3.translate(matrix, 200, 550);
    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Cube

    function degToRad(d) {
      return d * Math.PI / 180;
    }

    const program2 = webglUtils.createProgramFromSources(gl, [vertexShaderSource2, fragmentShaderSource2]);
    const positionAttributeLocation2 = gl.getAttribLocation(program2, "a_position");
    const matrixLocation2 = gl.getUniformLocation(program2, "u_matrix");

    gl.enable(gl.DEPTH_TEST);
    const vao2 = gl.createVertexArray();
    gl.bindVertexArray(vao2);
    gl.enableVertexAttribArray(positionAttributeLocation2);

    const positionBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer2);
    setCubeGeometry(gl);
    gl.vertexAttribPointer(positionAttributeLocation2, 4, gl.FLOAT, false, 0, 0);

    gl.useProgram(program2);
    gl.bindVertexArray(vao2);

    let matrix1 = m4.perspective(degToRad(60), gl.canvas.clientWidth / gl.canvas.clientHeight, 1, 2000);
    matrix1 = m4.translate(matrix1, 0, -150, -1000);
    matrix1 = m4.xRotate(matrix1, degToRad(30));
    matrix1 = m4.yRotate(matrix1, degToRad(60));
    matrix1 = m4.scale(matrix1, 60, 60, 60);

    gl.uniformMatrix4fv(matrixLocation2, false, matrix1);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
}

function setFGeometry(gl) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      // left column
      0, 0, 30, 0, 0, 150, 0, 150, 30, 0, 30, 150,

      // top rung
      30, 0, 100, 0, 30, 30, 30, 30, 100, 0, 100, 30,

      // middle rung
      30, 60, 67, 60, 30, 90, 30, 90, 67, 60, 67, 90,
    ]),
    gl.STATIC_DRAW,
  );
}

function setTriangleGeometry(gl) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 0, 0, 100, 100, 0]),
    gl.STATIC_DRAW,
  );
}

function setSquareGeometry(gl) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 0, 100, 0, 0, 100, 100, 0, 100, 100, 0, 100]),
    gl.STATIC_DRAW,
  );
}

function setPentagonGeometry(gl) {
  const vertices = [];
  const radius = 60;
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    vertices.push(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius
    );
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}

function setCubeGeometry(gl) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1, 1, 1, 1, -1, 1, 1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, 1, 1, -1, 1, 1, 1,

      -1, -1, -1, 1, -1, 1, -1, 1, 1, 1, -1, 1, -1, -1, -1, 1, 1, 1, -1, 1, 1, -1, -1, 1,

      -1, 1, -1, 1, 1, 1, -1, 1, 1, 1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1, -1, 1, 1, 1,

      -1, -1, -1, 1, -1, -1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, -1, -1, 1,

      1, -1, -1, 1, 1, 1, -1, 1, 1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, 1, 1, -1, 1, 1,

      -1, -1, -1, 1, -1, -1, 1, 1, -1, 1, 1, 1, -1, -1, -1, 1, -1, 1, 1, 1, -1, 1, -1, 1
    ]),
    gl.STATIC_DRAW,
  );
}
main();
