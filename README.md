# fronius

This package simplifies the access to the Fronius Solar JSON API.

## Usage

### Client

The `Client` class handles requests to a server that implements the [Fronius Solar API (JSON)](https://www.fronius.com/de/solarenergie/produkte/alle-produkte/anlagen-monitoring/offene-schnittstellen/fronius-solar-api-json-).
The client is also able to parse the result and return it in an alternative format.
See the formats section for more details about the supported formats.

#### async archive({ start, end, format })

Requests the archive data for all known channels in the given time range.
The following options are supported:

- `start`: The start date as a `Date` object
- `end`: The end date as a `Date` object
- `format`: The result format as a string (default: `json`)

#### async powerFlow({ format })

Requests the power flow real-time data.
The following options are supported:

- `format`: The result format as a string (default: `json`)

## Formats

The package supports three different data formats.

### raw

The `raw` format is the data structure as described in the Fronius Solar API (JSON) document.
The basic data structure looks like this:

```json
{
   "Body" : {
      "Data" : {}
   },
   "Head" : {
      "RequestArguments" : {},
      "Status" : {
         "Code" : 0,
         "Reason" : "",
         "UserMessage" : ""
      },
      "Timestamp" : "2020-01-01T00:00:00+01:00"
   }
}
```

The actual data can be found in `Body.Data`.
Besides the basic data structure, data itself looks different for each method.
Consult the Fronius Solar API (JSON) document for more details.

### json

The `json` format is an array of observations objects.
For each device and timestamp, a separate observation is generated.
Here is an example with inverter, solar and battery observations:

```json
[
  {
    "id": "inverter/1/observation/2020010100000",
    "type": "Observation",
    "observedBy": "inverter/1",
    "start": "2019-12-31T23:55:00.000Z",
    "end": "2020-01-01T00:00:00.000Z",
    "powerIncoming": 844.02,
    "powerOutgoing": 852,
    "energyIncoming": 70.33500000000001,
    "energyOutgoing": 70.8
  }, 
  {
    "id": "solar/1/observation/2020010100000",
    "type": "Observation",
    "observedBy": "solar/1",
    "start": "2019-12-31T23:55:00.000Z",
    "end": "2020-01-01T00:00:00.000Z",
    "powerIncoming": 0,
    "powerOutgoing": 0,
    "energyIncoming": 0,
    "energyOutgoing": 0
  },
  {
    "id": "battery/1/observation/2020010100000",
    "type": "Observation",
    "observedBy": "battery/1",
    "start": "2019-12-31T23:55:00.000Z",
    "end": "2020-01-01T00:00:00.000Z",
    "powerIncoming": 0,
    "powerOutgoing": 844.02,
    "energyIncoming": 0,
    "energyOutgoing": 70.33500000000001,
    "stateOfCharge": 0.35200000000000004
  }
]
```

An observation object can have the following properties:

- `id`: A unique id for each observation
- `type`: The type of the object (static value: `Observation`)
- `observedBy`: The device that made the observation
- `start`: The start time as an ISO date string
- `end`: The end time as an ISO date string
- `powerIncoming`: The incoming power in W 
- `powerOutgoing`: The outgoing power in W
- `energyIncoming`: The incoming energy in Wh
- `energyOutgoing`: The outgoing energy in Wh
- `stateOfCharge`: The state of charge of the battery as a double value in a range between 0.0 and 1.0

### rdf

The `rdf` format uses the structure of the `json` format and converts it into an array of [RDF/JS Quads](http://rdf.js.org/data-model-spec/#quad-interface).
Here is an example based on the same data as in the `json` format section:

```turtle
@prefix cube: <http://ns.bergnet.org/cube/> .
@prefix energy: <http://ns.bergnet.org/energy/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<battery/1/observation/2020010100000> a cube:Observation ;
    energy:end "2020-01-01T00:00:00+00:00"^^xsd:dateTime ;
    energy:energyIncoming 0e+00 ;
    energy:energyOutgoing 7.0335e+01 ;
    energy:observedBy <battery/1> ;
    energy:powerIncoming 0e+00 ;
    energy:powerOutgoing 8.4402e+02 ;
    energy:start "2019-12-31T23:55:00+00:00"^^xsd:dateTime ;
    energy:stateOfCharge 3.52e-01 .

<inverter/1/observation/2020010100000> a cube:Observation ;
    energy:end "2020-01-01T00:00:00+00:00"^^xsd:dateTime ;
    energy:energyIncoming 7.0335e+01 ;
    energy:energyOutgoing 7.08e+01 ;
    energy:observedBy <inverter/1> ;
    energy:powerIncoming 8.4402e+02 ;
    energy:powerOutgoing 8.52e+02 ;
    energy:start "2019-12-31T23:55:00+00:00"^^xsd:dateTime .

<solar/1/observation/2020010100000> a cube:Observation ;
    energy:end "2020-01-01T00:00:00+00:00"^^xsd:dateTime ;
    energy:energyIncoming 0e+00 ;
    energy:energyOutgoing 0e+00 ;
    energy:observedBy <solar/1> ;
    energy:powerIncoming 0e+00 ;
    energy:powerOutgoing 0e+00 ;
    energy:start "2019-12-31T23:55:00+00:00"^^xsd:dateTime .
```

All quads use the `id` property as subject.
The `type` is mapped to `rdf:type`.
`Observation` and `observedBy` are mapped to the `http://ns.bergnet.org/cube/` namespace.
All other properties are mapped to the `http://ns.bergnet.org/energy/` namespace.
The date values are converted to literal with the datatype `xsd:dateTime`.
For all number values the datatype `xsd:double` is used.

## Date and Time

**If you want to use the archive API, it's highly recommended to set the timezone of the inverter to Reykjavík (Island)!**

The JSON structure of the archive API has a design issue that causes data loss during days when daylight saving is changed.
Offsets are used for the data key/value pairs.
The offset is calculated from the start time and the local time of the data.
During daylight saving changes, the timezone offset of the start and the data can be different.
That leads to key/value pairs with the same offset, but only one can be used in the data structure.
It's a known and confirmed issue, but Fronius will not fix it.

## command-line interface

The package contains also a command-line interface tool.
It can be found in `bin/fronius.cli` and is added to the path in `npm` as `fronius`.
See the usage for more information:

```sh
fronius --help
``` 
