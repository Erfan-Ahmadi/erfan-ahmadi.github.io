---
layout: post
title: Effortless Simplex 2D Grid  
permalink: /blog/simplex/
---

## Background

![simplex_grid](https://github.com/user-attachments/assets/1a236363-13d9-4cac-bef5-e7f4da192a46)

Recently at work, I needed to draw an infinite simplex grid in the fragment shader to prototype height shading and contours of Digital Terrain Models in [shadertoy](https://www.shadertoy.com/view/3cXXDl). While searching for an efficient approach I stumbled upon this [lovely shader](https://www.shadertoy.com/view/WtfGDX) by [Shane](https://www.shadertoy.com/user/Shane). First I was very confused by the values and magic numbers used to do that in the shadertoy. But, with a little help from my good friend ChatGPT, I realized that the values originate from the Simplex noise algorithm—a technique devised by Ken Perlin in 2001. The transformation squashes a uniform grid in a way that forms equilateral triangles.

<p align="center">
  <img src="https://github.com/user-attachments/assets/20d6ba72-33e4-470f-bc85-866884ba9918" style="width: 50%; height: auto;">
  <br>
  <a href="https://www.desmos.com/calculator/azj9ewvl5b">Play in Desmos!</a>
</p>

Now, if you know me, you know that I can't just use something without mathematically proving why it works or at least gain a deeper intuition of why it works. So the focus of this post is to derive this 2D transformation.

But first, let's build some intuition

## Intuition

In order to draw a triangle grid we need to first figure out the triangle our point `p` resides in, and then retrieve it's vertices. So how do we do that?

In a uniform grid, if we want to determine which square cell a point belongs to, we simply take `floor(x)` and `floor(y)`, which gives us the coordinates of the bottom-left corner of the cell. Makes us wonder—can we do something similar for an equilateral triangle grid?

<p align="center">
  <img src="https://github.com/user-attachments/assets/c2d19064-e4ae-4eaa-9643-0cc97488bd03" style="width: 50%; height: auto;">
  <br>
  <a href="https://www.desmos.com/calculator/7qj5todlyv">Play in Desmos!</a>
</p>

If only we could just `floor()` our point and instantly get the nearest triangle corner! Unfortunately, life isn’t that simple... or is it?

This is exactly where the simplex transformation comes in. We stretch and shear our space so that the equilateral triangles lie perfectly with the square grids. Now in this transform space we simple `floor()` our point in question to snap it to the closest grid corner—just like we would in a uniform grid.
We then transform that snapped corner back into our original space where it now represents the triangle corner.

<p align="center">
  <img src="https://raw.githubusercontent.com/Erfan-Ahmadi/erfan-ahmadi.github.io/master/images/Simplex/steps.gif" style="width: 50%; height: auto;">
  <br>
  <a href="https://www.desmos.com/calculator/23d2qbuvzm">Play in Desmos!</a>
</p>

So Effortless and Efficient!

## Derivation of this transformation

Now, let's derive this transformation based on assumptions on how it should behave:

### Observation 1: Linearity and Matrix Representation
The transformation preserves straight lines and maintains parallelism without translation, it must be a linear transformation.

It is a linear transformation in 2D, so it can be represented by a 2×2 matrix:

Test Math Expression: $\sqrt{3x-1}+(1+x)^2$
<p>
  
$$
\begin{bmatrix} 2 & 3 \\ 1 & 4 \end{bmatrix} 
\begin{bmatrix} x \\ y \end{bmatrix}
=
\begin{bmatrix} 2x + 3y \\ x + 4y \end{bmatrix}
$$

</p>

somethinh

$$
\begin{bmatrix} -1 & 5 \\ 3 & 0 \end{bmatrix} 
\begin{bmatrix} a \\ b \end{bmatrix}
=
\begin{bmatrix} -a + 5b \\ 3a \end{bmatrix}
$$

// TODO: Maths

### Observation 2: Points on the x=y line stay on the x=y line.
We're squashing perperndicular to the x=y diagonal,   

// TODO: Maths

### Observation 3: Lines perpendicular to x=y, stay perperndicular to x=y line
We're squashing perperndicular to the x=y diagonal,   

// TODO: Maths

### Observation 4: Lines parallel to the x=y will not be affected by the transformation
We're squashing perperndicular to the x=y diagonal, any line parallel to it will remain on it's position. for example let's see how y=x+1 is affected:

// TODO: Image

// TODO: Maths

### Deriving the value

based on the constraints and observations above we have discovered that the whole 2x2 linear transformation depends on a single value. let's see how changing this value will affect the transformation:

// TODO: GIF

We just need to find the value that will result in equilateral triangles, or putting it in terms of math:

// TODO: some helper image of the vectors involved

We have found the value used to transform a grid! here is the transformation used to get the uniform grid into simplex space.
// TOOD: Matrix

and the inverse:
// TODO: Matrix


## Final Words
// TODO write something to wrap everything up. and point that this is not only for 2D, and that I would love to see more robust similar intuition for higher dimensions

## References
// TODO
- https://www.shadertoy.com/view/WtfGDX
- https://en.wikipedia.org/wiki/Simplex_noise

