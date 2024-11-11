#version 300 es

/* Lecture 22: Advanced Shader Programming
 * CS 4388/ CS 5388, Fall 2024, Texas State University
 * Instructor: Isayas Berhe Adhanom <isayas@txstate.edu>
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */ 

precision mediump float;

#define POINT_LIGHT 0
#define DIRECTIONAL_LIGHT 1

const int MAX_LIGHTS = 8;

// position of the camera in world coordinates
uniform vec3 eyePositionWorld;

// properties of the lights in the scene
uniform int numLights;
uniform int lightTypes[MAX_LIGHTS];
uniform vec3 lightPositionsWorld[MAX_LIGHTS];
uniform vec3 ambientIntensities[MAX_LIGHTS];
uniform vec3 diffuseIntensities[MAX_LIGHTS];
uniform vec3 specularIntensities[MAX_LIGHTS];

// material properties (coefficents of reflection)
uniform vec3 kAmbient;
uniform vec3 kDiffuse;
uniform vec3 kSpecular;
uniform float shininess;
// new uniform variables para animar la luz

// animation data and need to be dfined in mywavematerial.ts
uniform float waveAngle;
uniform float waveScale;


// texture data
uniform int useTexture;
uniform sampler2D textureImage;

// data passed in from the vertex shader
in vec3 vertPositionWorld;
in vec3 vertNormalWorld;
in vec4 vertColor;
in vec2 uv;

// fragment shaders can only output a single color
out vec4 fragColor;

void main() 
{
    // Normalize the interpolated normal vector
    vec3 n = normalize(vertNormalWorld);

    // light calculations
    vec3 illumination = vec3(0, 0, 0);
    for(int i=0; i < numLights; i++)
    {
        // Ambient component
        illumination += kAmbient * ambientIntensities[i];

        // Don't forget to normalize the vectors!
        vec3 l;
        if(lightTypes[i] == POINT_LIGHT)
            l = normalize(lightPositionsWorld[i] - vertPositionWorld);
        else
            l = normalize(lightPositionsWorld[i]); 

        // implementar una especie de onda de luz usando un cosine funciton
        // float waveFactor=1.0;// un factor para modificar la propiead de la luz
        // we need to shift the cos function by 0.5 para no clamp los valores
        float waveFactor=cos(vertPositionWorld.y*waveScale+waveAngle)*0.5+0.5;// un factor para modificar la propiead de la luz


        // Diffuse component
        float diffuseComponent = max(dot(n, l), 0.0);
        // illumination += diffuseComponent * kDiffuse * diffuseIntensities[i];
        illumination += waveFactor*diffuseComponent * kDiffuse * diffuseIntensities[i];

        // Compute the vector from the vertex to the eye
        vec3 e = normalize(eyePositionWorld - vertPositionWorld);

        // Compute the halfway vector for the Blinn-Phong reflection model
        vec3 h = normalize(l + e);

        // Specular component
        float specularComponent = pow(max(dot(h, n), 0.0), shininess);
        illumination += specularComponent * kSpecular * specularIntensities[i];
    }

    fragColor = vertColor;
    fragColor.rgb *= illumination;// we are ignoring the alpha compnent
    // fragColor.a = waveScale; // testing to pass data using the alpha

    if(useTexture != 0)
    {
        fragColor *= texture(textureImage, uv);
    }
}