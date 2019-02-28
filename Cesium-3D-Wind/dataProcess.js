var DataProcess = (function () {
    var data;

    var loadNetCDF = function (filePath) {
        return new Promise(function (resolve) {
            var request = new XMLHttpRequest();
            request.open('GET', filePath);
            request.responseType = 'arraybuffer';

            request.onload = function () {
                var arrayToMap = function (array) {
                    return array.reduce(function (map, object) {
                        map[object.name] = object;
                        return map;
                    }, {});
                }

                var NetCDF = new netcdfjs(request.response);
                data = {};

                var dimensions = arrayToMap(NetCDF.dimensions);
                data.dimensions = {};
                data.dimensions.lon = dimensions['lon'].size;
                data.dimensions.lat = dimensions['lat'].size;
                data.dimensions.lev = dimensions['lev'].size;

                // the range of longitude in current used NetCDF file is [0, 360]
                data.lon = {};
                data.lon.array = new Float32Array(NetCDF.getDataVariable('lon').flat());
                data.lon.min = data.lon.array[0];
                data.lon.max = data.lon.array[data.lon.array.length - 1];

                // the range of latitude in current used NetCDF file is [-90, 90]
                data.lat = {};
                data.lat.array = new Float32Array(NetCDF.getDataVariable('lat').flat());
                data.lat.min = data.lat.array[0];
                data.lat.max = data.lat.array[data.lat.array.length - 1];

                data.lev = {};
                data.lev.array = new Float32Array(NetCDF.getDataVariable('lev').flat());
                data.lev.min = data.lev.array[0];
                data.lev.max = data.lev.array[data.lev.array.length - 1];

                data.U = {};
                data.U.array = new Float32Array(NetCDF.getDataVariable('U').flat());

                data.V = {};
                data.V.array = new Float32Array(NetCDF.getDataVariable('V').flat());

                resolve(data);
            };

            request.send();
        });
    }

    var randomizeParticle = function (maxParticles, min, max) {
        var array = new Float32Array(3 * maxParticles);

        for (var i = 0; i < maxParticles; i++) {
            array[3 * i] = Math.random() * (max.lon - min.lon) + min.lon;
            array[3 * i + 1] = Math.random() * (max.lat - min.lat) + min.lat;
            array[3 * i + 2] = Math.random() * (max.lev - min.lev) + min.lev;
        }

        return array;
    }

    var setupParticle = function (particlesTextureSize, fadeOpacity) {
        const maxParticles = particlesTextureSize * particlesTextureSize;

        data.particles = {};

        var min = {
            lon: data.lon.min,
            lat: data.lat.min,
            lev: data.lev.min,
        };
        var max = {
            lon: data.lon.max,
            lat: data.lat.max,
            lev: data.lev.max,
        };

        data.particles.array = randomizeParticle(maxParticles, min, max);

        data.particles.textureSize = particlesTextureSize;
        data.particles.fadeOpacity = fadeOpacity;
    }

    var process = async function (filePath, particlesTextureSize, fadeOpacity) {
        await loadNetCDF(filePath).then(function () {
            setupParticle(particlesTextureSize, fadeOpacity);
        });

        return data;
    }

    return {
        process: process,
        randomizeParticle: randomizeParticle
    };

})();