function fetchCarparkData() {
    $.ajax({
        url: 'https://api.data.gov.sg/v1/transport/carpark-availability',
        method: 'GET',
        success: handleData,
        error: function(error) {
            console.error('Error fetching data: ', error);
        }
    });
}

function handleData(data) {
    const carparks = data.items[0].carpark_data;
    const timestamp = data.items[0].timestamp; // Extracting timestamp

    // Define the categories
    const categorizedCarparks = {
        small: [],
        medium: [],
        big: [],
        large: []
    };

    carparks.forEach(carpark => {
        let totalLots = 0;
        let availableLots = 0;

        carpark.carpark_info.forEach(lotInfo => {
            totalLots += parseInt(lotInfo.total_lots, 10);
            availableLots += parseInt(lotInfo.lots_available, 10);
        });

        const carparkWithTotals = {
            ...carpark,
            totalLots,
            availableLots
        };

        // Categorize the carparks
        if (totalLots < 100) {
            categorizedCarparks.small.push(carparkWithTotals);
        } else if (totalLots < 300) {
            categorizedCarparks.medium.push(carparkWithTotals);
        } else if (totalLots < 400) {
            categorizedCarparks.big.push(carparkWithTotals);
        } else {
            categorizedCarparks.large.push(carparkWithTotals);
        }
    });

    updateUI(categorizedCarparks, timestamp);
}

function updateUI(carparkData, timestamp) {
    let htmlString = `<p>Data as of: ${timestamp}</p>`; // Displaying timestamp

    // Iterate through each category
    Object.keys(carparkData).forEach(category => {
        htmlString += `<div class="category-section">`;
        htmlString += `<h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>`;

        let maxLotsCarpark = [];
        let minLotsCarpark = [];
        let maxAvailableLots = -1;
        let minAvailableLots = Number.MAX_SAFE_INTEGER;

        carparkData[category].forEach(carpark => {
            if (carpark.availableLots > maxAvailableLots) {
                maxLotsCarpark = [carpark];
                maxAvailableLots = carpark.availableLots;
            } else if (carpark.availableLots === maxAvailableLots) {
                maxLotsCarpark.push(carpark);
            }

            if (carpark.availableLots < minAvailableLots) {
                minLotsCarpark = [carpark];
                minAvailableLots = carpark.availableLots;
            } else if (carpark.availableLots === minAvailableLots) {
                minLotsCarpark.push(carpark);
            }
        });

        htmlString += `
            <p><strong>HIGHEST:</strong> ${maxAvailableLots} lots available at ${maxLotsCarpark.map(carpark => carpark.carpark_number).join(',')}</p>
            <p><strong>LOWEST:</strong> ${minAvailableLots} lots available at ${minLotsCarpark.map(carpark => carpark.carpark_number).join(',')}</p>
        `;
        htmlString += `</div>`;
    });

    $('#carparkData').html(htmlString);
}

// Fetch the data when the page loads and then every 60 seconds
$(document).ready(function() {
    fetchCarparkData();
    setInterval(fetchCarparkData, 60000);
});
