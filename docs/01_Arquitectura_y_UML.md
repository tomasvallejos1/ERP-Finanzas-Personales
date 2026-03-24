# 01 - Arquitectura General y Modelado UML

Este documento establece la arquitectura base, los patrones de diseño y los modelos de dominio orientados a objetos que DEBEN respetarse durante todo el ciclo de desarrollo del ERP de Finanzas Personales.

## 1. Arquitectura Cloud y Despliegue

El sistema adopta una arquitectura basada en la nube (Cloud-Native) orientada a microservicios y consumo de APIs de terceros. Se divide físicamente en cuatro grandes capas para garantizar el bajo acoplamiento y la alta cohesión.

```mermaid
flowchart LR
    %% Definición de estilos
    classDef client fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px,color:#000000;
    classDef logic fill:#fff3e0,stroke:#ff9800,stroke-width:2px,color:#000000;
    classDef data fill:#e8f5e9,stroke:#4caf50,stroke-width:2px,color:#000000;
    classDef external fill:#fce4ec,stroke:#e91e63,stroke-width:2px,color:#000000;

    %% Capa de Clientes
    subgraph Capa_Presentacion [Capa de Presentación]
        direction TB
        Web([Navegador Web / UI]):::client
        WA([Usuario en WhatsApp]):::client
    end

    %% Capa Lógica (Vercel)
    subgraph Capa_Logica [Vercel Cloud]
        direction TB
        Frontend[Frontend: React.js]:::logic
        Backend[Backend API: Node.js]:::logic
    end

    %% Capa de Datos (Supabase)
    subgraph Capa_Datos [Supabase Cloud]
        DB[(PostgreSQL)]:::data
    end

    %% Capa de Servicios Externos
    subgraph Capa_Servicios [APIs Externas]
        direction TB
        Bot[Bot WhatsApp Middleware]:::external
        Gemini[API Gemini OCR/NLP]:::external
        IOL[API InvertirOnline]:::external
    end

    %% Relaciones y flujo de datos
    Web <-->|HTTPS / REST| Frontend
    Frontend <-->|Llamadas HTTP| Backend
    WA <-->|Mensajes| Bot
    Bot <-->|Webhooks REST| Backend
    
    Backend <-->|ORM Sequelize| DB
    
    Backend <-->|Peticiones HTTP| Gemini
    Backend <-->|Peticiones HTTP| IOL
```

## 2. Patrones de Diseño Utilizados

El desarrollo del sistema se fundamenta en los siguientes patrones de diseño de software:

* **MVC (Modelo-Vista-Controlador) Evolucionado:** Adaptado para arquitectura de API REST. El Frontend (React) actúa como Vista pura, los Routers/Controllers de Node.js validan los *requests*, y el ORM Sequelize gestiona los Modelos.
* **Patrón Singleton (Instancia Única):** OBLIGATORIO para la conexión a la base de datos (Supabase Client) y clientes de APIs externas (Gemini AI) para prevenir saturación de memoria en el entorno Serverless.
* **Patrón Facade (Fachada):** Utilizado en la capa de servicios del Backend para abstraer la complejidad de la comunicación con la IA (armado de prompts y parseo JSON).
* **Patrón Webhook / Observer:** Implementado para capturar los eventos asíncronos provenientes del bot de WhatsApp.

## 3. Modelo de Dominio (Diagrama de Clases)

El siguiente diagrama define las entidades estáticas, sus métodos clave y sus atributos con tipos de datos estrictos. Las relaciones de multiplicidad dictan cómo el ORM debe definir las asociaciones.

*Nota de Arquitectura:* La entidad `Broker` está normalizada y abstraída de `ActivoFinanciero`. Además, las `Cuotas` derivan estrictamente de la entidad `Movimiento` y NO de la `TarjetaCredito` para garantizar la integridad referencial.

```mermaid
classDiagram
    class Usuario {
        +UUID id
        +String nombre
        +String email
        +String password_hash
        +Date fecha_registro
        +autenticar()
        +recalcularPatrimonio()
    }

    class Cuenta {
        +UUID id
        +String nombre
        +Enum tipo (Banco, Efectivo, Billetera)
        +Decimal saldo_actual
        +actualizarSaldo()
    }

    class TarjetaCredito {
        +UUID id
        +String banco
        +Enum emisora (Visa, Mastercard, Amex)
        +String ultimos_4_digitos
        +Int dia_cierre
        +Int dia_vencimiento
        +Decimal limite_credito
        +calcularDeudaMensual()
    }

    class Categoria {
        +UUID id
        +String nombre
        +Enum tipo_categoria
    }

    class Movimiento {
        +UUID id
        +Decimal monto
        +Date fecha
        +Enum tipo (Ingreso, Egreso, Transferencia)
        +String descripcion
        +procesarTransaccion()
    }

    class Cuota {
        +UUID id
        +Int numero_cuota
        +Int total_cuotas
        +Decimal monto_cuota
        +Date mes_cobro
        +Enum estado (Pendiente, Pagada)
    }

    class Broker {
        +UUID id
        +String nombre
        +Enum tipo_plataforma (Bursatil, Crypto, Banco)
    }

    class ActivoFinanciero {
        +UUID id
        +String ticker
        +Enum tipo_activo (CEDEAR, Accion, Bono, FCI, Crypto)
        +Enum moneda_compra (ARS, USD)
        +Decimal cantidad
        +Decimal precio_compra
        +actualizarCotizacion()
    }

    %% Relaciones
    Usuario "1" -- "*" Cuenta : posee
    Usuario "1" -- "*" Categoria : personaliza
    Usuario "1" -- "*" Broker : opera con
    Cuenta "1" -- "*" Movimiento : registra
    Cuenta "1" -- "*" TarjetaCredito : asociada a
    Categoria "1" -- "*" Movimiento : clasifica
    TarjetaCredito "1" -- "*" Movimiento : financia
    Movimiento "1" -- "*" Cuota : se divide en
    Broker "1" -- "*" ActivoFinanciero : custodia
```

## 4. Flujos de Interacción (Diagrama de Secuencia)

El flujo asíncrono principal (Carga Automatizada vía WhatsApp) requiere la orquestación temporal descrita a continuación. Ningún endpoint debe bloquear el *Event Loop* durante la consulta a la API de OCR.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant W as Bot WhatsApp
    participant IA as API Gemini (OCR)
    participant B as Backend (Node.js)
    participant BD as Base de Datos (Supabase)

    U->>W: Envía foto de ticket/comprobante
    activate W
    W->>IA: Petición HTTP POST (Imagen)
    activate IA
    Note over IA: Procesa NLP y extrae entidades
    IA-->>W: Retorna JSON estructurado (Monto, Fecha, Categoría)
    deactivate IA
    
    W->>B: POST /api/movimientos (payload JSON)
    activate B
    B->>B: Valida formato y token
    B->>BD: INSERT INTO movimientos
    activate BD
    BD-->>B: Retorna entidad creada (UUID)
    deactivate BD
    
    B->>B: Recalcula patrimonio neto
    B-->>W: Respuesta HTTP 201 Created
    deactivate B
    
    W-->>U: Mensaje "✅ Gasto de $X registrado con éxito"
    deactivate W
```