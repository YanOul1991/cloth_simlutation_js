# Cloth simulation

# Verlet Integration

## Basics
let :
  `∫ 2x dx + C`
where : 
    ∫ -> Integral symbole
    2x -> Function to integrate
    dx -> Infinitly small slice along which we integrate;
    C -> Integration constant

---

## Motion
let : 
    `F = ma;`
where :
    F = force
    m = mass
    a = acceleration

We then know that :
    a = F/m

__Acceleration is equal to the first derivative of the velocity within time__ 
therefore : 
    v = dx/dt
where : 
    v = velocity 

## Verlet integration 
let : 
    x(t + dt) = 2x(t) - x(t-dt) + a(t)dt^2
where :
    x(t + dt) -> Next position at a given time
    2x(t) ->
    x(t - dt) -> Previous position
    a(t)dt^2 