// Script adapté du logiciel SimClim de Camille Risi / Cabinet d'Études Informatiques Alain Deseine

// Constants
const sigma = 5.67e-8;               // Stefan-Boltzmann constant (W·m⁻²·K⁻⁴)
const S0_Terre = 1361;               // Solar flux for Earth (W/m²)
const Tref_C = 14.4;                 // Reference temperature (°C)
const Tref = Tref_C + 273;           // Reference temperature (K)
const psatref = Math.exp(13.7 - 5120. / Tref); // Vapor pressure at Tref (Pa)
const CO2ref = 280;                  // Pre-industrial CO₂ level (ppm)
const Q = 0.6;                       // Runaway greenhouse dampening factor 1
const p = 0.23;                      // Runaway greenhouse dampening factor 2

// Pre-calculate G0 for A = 0.3 (constant)
const F0in_ref = S0_Terre / 4;
const G0 = 1. - (1. - 0.3) * F0in_ref / (sigma * Math.pow(Tref, 4));

// Model state
const modelState = {
    CO2: 280,
    albedo : 0.3,
    S0: 1,
    temperature : 15,
}

//HTML elements
const modelUI = {
    co2Input: null,
    albedoInput : null,
    solar: null,
    iceAlbedoToggle : null,
    temperatureValue : null,
    effectiveAlbedoValue: null,
}

//Recupere les elements
function bindModelUI() {
    modelUI.co2Input = document.getElementById('co2-input');
    modelUI.albedoInput = document.getElementById('albedo-input');
    modelUI.solarInput = document.getElementById('solar-input');
    modelUI.iceAlbedoToggle = document.getElementById('ice-albedo-toggle');
    modelUI.temperatureValue = document.getElementById('temperature-value');
    modelUI.effectiveAlbedoValue = document.getElementById('effective-albedo-value');

    if (!modelUI.co2Input)
        console.error("co2-input introuvable");
}

//eviter les problemes de saisies de virgules / points
function clampInput(input, min, max) {
    let value = parseFloat(input.value.replace(",", "."));
    if (isNaN(value))
        return;
    value = Math.min(max, Math.max(min, value));
    input.value = value;
}

//Branche les elements
function bindModelEvents() {

    modelUI.co2Input.oninput = updateTemperature;

    modelUI.albedoInput.onchange = function () {
        clampInput(this, 0, 1);
        updateTemperature();
    };

    modelUI.solarInput.onchange = function () {
        clampInput(this, 0.5, 2);
        updateTemperature();
    };

    modelUI.iceAlbedoToggle.onchange = updateTemperature;

}

//Initialisation
function initModel() {

    bindModelUI()

    bindModelEvents();

    updateTemperature();

}

// Calculate dynamic albedo based on temperature (ice-albedo feedback)
function calculateDynamicAlbedo(temperature) {
   const A_warm = 0.25
   const A_cold = 0.65
   const T_mid  = 5
   const T_width = 10
   let Albedo = A_warm + (A_cold - A_warm) * 0.5 * (1 - Math.tanh((temperature - T_mid)/T_width))
   return Albedo;
}

// Calculate equilibrium temperature
function calculateEquilibriumTemperature(CO2, S0, A) {
    const F0in = S0 / 4;
    const relaxation_factor = 0.5;
    let Teq = Tref; // Initial guess

    // Calculate GCO2
    let GCO2;
    if (CO2 > 0) {
        GCO2 = 0.018 * Math.log(CO2 / CO2ref);
    } else {
        GCO2 = -G0*0.74
    }
    let G = G0 + GCO2;
    Teq = Math.pow(((1. - A) * F0in / (1. - G) / sigma), 0.25);

    // Iterative water vapor feedback
    let Gwater;
    let Teq_new;
    for (let i = 0; i < 100; i++) {
        // Rankine relation
        const RH2O = Math.exp(13.7 - 5120. / Teq) / psatref;
        Gwater = -Q * G0 * (1. - Math.pow(RH2O, p));

        // Clip Gwater to [-0.4, 0.4]
        Gwater = Math.min(Math.max(Gwater, -0.4), 0.4);

        G = G0 + GCO2 + Gwater;
        Teq_new = Math.pow(((1. - A) * F0in / (1. - G) / sigma), 0.25);

        // Relaxation
        Teq = relaxation_factor * Teq_new + (1 - relaxation_factor) * Teq;
    }

    return Teq - 273; // Convert to Celsius
}


// Update temperature and climate state
function updateTemperature() {
    if (!modelUI.co2Input) return;

    const CO2 = parseFloat(modelUI.co2Input.value);
    const userAlbedo = parseFloat(modelUI.albedoInput.value);
    const S0 = parseFloat(modelUI.solarInput.value) * S0_Terre;
    const useIceAlbedoFeedback = modelUI.iceAlbedoToggle.checked;

    // Determine effective albedo
    let A;
    if (useIceAlbedoFeedback) {
        // Calculate temperature with user albedo first (to determine dynamic albedo)
        const tempWithUserAlbedo = calculateEquilibriumTemperature(CO2, S0, userAlbedo);
        A = calculateDynamicAlbedo(tempWithUserAlbedo);
        modelUI.albedoInput.disabled = true;
    } else {
        A = userAlbedo;
        modelUI.albedoInput.disabled = false;
    }

    // Update effective albedo display
    modelUI.effectiveAlbedoValue.textContent = A.toFixed(2);

    // Calculate absorbed flux for climate state
    const F0in = S0 / 4;
    const absorbedFlux = F0in * (1 - A);

    // Calculate equilibrium temperature with effective albedo
    const temperature = calculateEquilibriumTemperature(CO2, S0, A);
    modelUI.temperatureValue.textContent = temperature.toFixed(1);
    modelState.CO2 = CO2
    modelState.temperature = temperature
    modelState.albedo = A
    modelState.S0 = S0
}