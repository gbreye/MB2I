import mongoose from "mongoose";

// Mostra os dados recebidos pelo ESP32, um documento por dispositivo.
// Cada requisição do ESP vem com `id` -> upsert no documento daquele `espId`.
const espDataSchema = new mongoose.Schema(
  {
    espId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    moisture: {
      type: Number,
      default: null,
    },
    celsius: {
      type: Number,
      default: null,
    },
    solarlight: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true },
);

// Resposta padronizada: { espId, moisture, celsius, solarlight, updatedAt }
espDataSchema.method("toReading", function () {
  return {
    espId: this.espId,
    moisture: this.moisture ?? null,
    celsius: this.celsius ?? null,
    solarlight: this.solarlight ?? null,
    updatedAt: (this.updatedAt ?? this.createdAt ?? new Date()).toISOString(),
  };
});

const EspData = mongoose.models.EspData ?? mongoose.model("EspData", espDataSchema);

export default EspData;
