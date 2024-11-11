/* Lecture 22: Advanced Shader Programming
 * CS 4388/ CS 5388, Fall 2024, Texas State University
 * Instructor: Isayas Berhe Adhanom <isayas@txstate.edu>
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */ 

// You only need to modify the shaders for this assignment.
// You do not need to write any TypeScript code unless
// you are planning to add wizard functionality.

// @ts-ignore
import waveVertexShader from './shaders/mywave.vert'
// @ts-ignore
import waveFragmentShader from './shaders/mywave.frag'

import * as gfx from 'gophergfx'


export class MyWaveMaterial extends gfx.Material3
{
    // puedo cambiar estas propiedad para cambiar las propiedades del material fuera de material class
    public texture: gfx.Texture | null;
    public ambientColor: gfx.Color;//reflection coeficients
    public diffuseColor: gfx.Color;//reflection coeficients
    public specularColor: gfx.Color;//reflection coeficients
    public shininess: number;
    
    public waveAngle: number; // defini nueas propiedades del mataril
    public waveScale: number;

    // call to shader program that calls hadder files
    public static shader = new gfx.ShaderProgram(waveVertexShader, waveFragmentShader);

    // todas estas  variables estan definiads en el shader program
    private kAmbientUniform: WebGLUniformLocation | null;
    private kDiffuseUniform: WebGLUniformLocation | null;
    private kSpecularUniform: WebGLUniformLocation | null;
    private shininessUniform: WebGLUniformLocation | null;
    
    private textureUniform: WebGLUniformLocation | null;
    private useTextureUniform: WebGLUniformLocation | null;

    // transformation matrices
    private modelUniform: WebGLUniformLocation | null;
    private normalUniform: WebGLUniformLocation | null;
    private viewUniform: WebGLUniformLocation | null;
    private projectionUniform: WebGLUniformLocation | null;
    
    // 
    private eyePositionWorldUniform: WebGLUniformLocation | null;
    private numLightsUniform: WebGLUniformLocation | null;
    private lightTypesUniform: WebGLUniformLocation | null;
    private lightPositionsWorldUniform: WebGLUniformLocation | null;
    private ambientIntensitiesUniform: WebGLUniformLocation | null;
    private diffuseIntensitiesUniform: WebGLUniformLocation | null;
    private specularIntensitiesUniform: WebGLUniformLocation | null;
    
    // estas variables cambian por cada vertice y no se definen como uniforme
    private positionAttribute: number;
    private normalAttribute: number;
    private colorAttribute: number;
    private texCoordAttribute: number;

    // animation data
    private waveScaleUniform: WebGLUniformLocation | null;
    private waveAngleUniform: WebGLUniformLocation | null;

    constructor()
    {
        super();
        
        // initialize default material properties
        this.texture = null;
        this.ambientColor = new gfx.Color(1, 1, 1);
        this.diffuseColor = new gfx.Color(1, 1, 1);
        this.specularColor = new gfx.Color(0, 0, 0);
        this.shininess = 30;
        this.waveAngle=0;
        this.waveScale=1;

        //init shader (load into gpu)
        MyWaveMaterial.shader.initialize(this.gl);

        // binding las variables uniformes que estan definidas en nuestro shader program
        this.kAmbientUniform = MyWaveMaterial.shader.getUniform(this.gl, 'kAmbient');
        this.kDiffuseUniform = MyWaveMaterial.shader.getUniform(this.gl, 'kDiffuse');
        this.kSpecularUniform = MyWaveMaterial.shader.getUniform(this.gl, 'kSpecular');
        this.shininessUniform = MyWaveMaterial.shader.getUniform(this.gl, 'shininess');

        this.textureUniform = MyWaveMaterial.shader.getUniform(this.gl, 'textureImage');
        this.useTextureUniform = MyWaveMaterial.shader.getUniform(this.gl, 'useTexture');

        this.modelUniform = MyWaveMaterial.shader.getUniform(this.gl, 'modelMatrix');
        this.normalUniform = MyWaveMaterial.shader.getUniform(this.gl, 'normalMatrix');
        this.viewUniform = MyWaveMaterial.shader.getUniform(this.gl, 'viewMatrix');
        this.projectionUniform = MyWaveMaterial.shader.getUniform(this.gl, 'projectionMatrix');

        this.eyePositionWorldUniform = MyWaveMaterial.shader.getUniform(this.gl, 'eyePositionWorld');
        this.numLightsUniform = MyWaveMaterial.shader.getUniform(this.gl, 'numLights');
        this.lightTypesUniform = MyWaveMaterial.shader.getUniform(this.gl, 'lightTypes');
        this.lightPositionsWorldUniform = MyWaveMaterial.shader.getUniform(this.gl, 'lightPositionsWorld');
        this.ambientIntensitiesUniform = MyWaveMaterial.shader.getUniform(this.gl, 'ambientIntensities');
        this.diffuseIntensitiesUniform = MyWaveMaterial.shader.getUniform(this.gl, 'diffuseIntensities');
        this.specularIntensitiesUniform = MyWaveMaterial.shader.getUniform(this.gl, 'specularIntensities');

        this.positionAttribute = MyWaveMaterial.shader.getAttribute(this.gl, 'position');
        this.normalAttribute = MyWaveMaterial.shader.getAttribute(this.gl, 'normal');
        this.colorAttribute = MyWaveMaterial.shader.getAttribute(this.gl, 'color');
        this.texCoordAttribute = MyWaveMaterial.shader.getAttribute(this.gl, 'texCoord'); 
        
        // binding new properties
        this.waveScaleUniform = MyWaveMaterial.shader.getUniform(this.gl, 'waveScale');   
        this.waveAngleUniform = MyWaveMaterial.shader.getUniform(this.gl, 'waveAngle');   // get unfiform instead of attribute becaus euniform data
    }
    // este es el draw call que se repite despues de cada actualizacion
    // una vez por objeto
    // dibbuja la scenena
    // mesh (buffers y data de la mesh / referencia de la camara y su transfor matrix/ lightmanager todas lasluces que estan en la escena)
    draw(mesh: gfx.Mesh3, camera: gfx.Camera, lightManager: gfx.LightManager): void
    {
        if(!this.visible || mesh.triangleCount == 0) // revisa si objeto es visible
            return;

        this.initialize();

        // Switch to this shader
        // this.gl una llamada al la libreria grafica
        this.gl.useProgram(MyWaveMaterial.shader.getProgram());

        // Set the camera and model matrix uniforms
        const modelMatrix = mesh.localToWorldMatrix;
        const normalModelMatrix = modelMatrix.inverse().transpose();
        const cameraPositionWorld = camera.localToWorldMatrix.transformPoint(new gfx.Vector3(0,0,0));
        this.gl.uniformMatrix4fv(this.modelUniform, false, modelMatrix.mat);
        this.gl.uniformMatrix4fv(this.normalUniform, false, normalModelMatrix.mat);
        this.gl.uniformMatrix4fv(this.viewUniform, false, camera.viewMatrix.mat);
        this.gl.uniformMatrix4fv(this.projectionUniform, false, camera.projectionMatrix.mat);

        // Set the material property uniforms
        this.gl.uniform3f(this.kAmbientUniform, this.ambientColor.r, this.ambientColor.g, this.ambientColor.b);
        this.gl.uniform3f(this.kDiffuseUniform, this.diffuseColor.r, this.diffuseColor.g, this.diffuseColor.b);
        this.gl.uniform3f(this.kSpecularUniform,this.specularColor.r, this.specularColor.g, this.specularColor.b);
        this.gl.uniform1f(this.shininessUniform, this.shininess);

        // Set the light uniforms
        // 3f = float 3 , 1i integer1, 3fv flaot3 vector
        this.gl.uniform3f(this.eyePositionWorldUniform, cameraPositionWorld.x, cameraPositionWorld.y, cameraPositionWorld.z);
        this.gl.uniform1i(this.numLightsUniform, lightManager.getNumLights());
        this.gl.uniform1iv(this.lightTypesUniform, lightManager.lightTypes);
        this.gl.uniform3fv(this.lightPositionsWorldUniform, lightManager.lightPositions);
        this.gl.uniform3fv(this.ambientIntensitiesUniform, lightManager.ambientIntensities);
        this.gl.uniform3fv(this.diffuseIntensitiesUniform, lightManager.diffuseIntensities);
        this.gl.uniform3fv(this.specularIntensitiesUniform, lightManager.specularIntensities);

        // Set the vertex positions
        this.gl.enableVertexAttribArray(this.positionAttribute);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.positionBuffer);
        this.gl.vertexAttribPointer(this.positionAttribute, 3, this.gl.FLOAT, false, 0, 0);

        // Set the vertex normals
        this.gl.enableVertexAttribArray(this.normalAttribute);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.normalBuffer);
        this.gl.vertexAttribPointer(this.normalAttribute, 3, this.gl.FLOAT, false, 0, 0);

        // send data we need to send to the shader
        // set animation uniforms
        // this.gl.uniform1f(this.waveAngleUniform,0);
        // this.gl.uniform1f(this.waveScaleUniform,0.2);// passing data succesfuly
        this.gl.uniform1f(this.waveAngleUniform,this.waveAngle);// asignar las propieades
        this.gl.uniform1f(this.waveScaleUniform,this.waveScale);// passing data succesfuly

        // Set the vertex colors
        if(mesh.hasVertexColors)
        {
            this.gl.enableVertexAttribArray(this.colorAttribute);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.colorBuffer);
            this.gl.vertexAttribPointer(this.colorAttribute, 4, this.gl.FLOAT, false, 0, 0);
        }
        else
        {
            this.gl.disableVertexAttribArray(this.colorAttribute);
            this.gl.vertexAttrib4f(this.colorAttribute, 1, 1, 1, 1);// default color
        }

        if(this.texture)
        {
            // Activate the texture in the shader
            this.gl.uniform1i(this.useTextureUniform, 1);

            // Set the texture
            this.gl.activeTexture(this.gl.TEXTURE0 + this.texture.id)
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture.texture);
            this.gl.uniform1i(this.textureUniform, this.texture.id);

            // Set the texture coordinates
            this.gl.enableVertexAttribArray(this.texCoordAttribute);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.texCoordBuffer);
            this.gl.vertexAttribPointer(this.texCoordAttribute, 2, this.gl.FLOAT, false, 0, 0);
        }
        else
        {
            // Disable the texture in the shader
            this.gl.uniform1i(this.useTextureUniform, 0);
            this.gl.disableVertexAttribArray(this.texCoordAttribute);
        }

        // Draw the triangles
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, mesh.triangleCount*3, this.gl.UNSIGNED_SHORT, 0);
    }

    setColor(color: gfx.Color): void
    {
        this.ambientColor.copy(color);
        this.diffuseColor.copy(color);
        this.specularColor.copy(color);
    }

    getColor(): gfx.Color
    {
        return this.diffuseColor;
    }
}