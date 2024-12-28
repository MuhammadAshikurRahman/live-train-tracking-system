let trainData = []; // Store train data globally

        async function fetchTrainData() {
            try {
                const response = await fetch('/getAllTrains');

                if (!response.ok) {
                    throw new Error('Failed to fetch train data');
                }

                trainData = await response.json();
                displayTrains(trainData);
            } catch (error) {
                console.error('Error fetching train data:', error);
            }
        }

        function displayTrains(trains) {
            const trainContainer = document.getElementById('trainContainer');
            trainContainer.innerHTML = '';

            if (trains.length === 0) {
                trainContainer.innerHTML = `<p class="no-data">Apadoto kono tottho nai</p>`;
                return;
            }

            trains.forEach(train => {
                const trainDiv = document.createElement('div');
                trainDiv.className = 'train-info';

                const updatedTime = train.updatedAt
                    ? new Date(train.updatedAt).toLocaleString()
                    : 'N/A';

                const messages = train.messages.filter(msg => msg.trim() !== '');
                const lastMessage = messages.length > 0
                    ? `<li class="highlight">${messages[messages.length - 1]}</li>`
                    : '';

                const avgLocation = train.avgLocation || 'Lat: N/A, Lon: N/A';
                const latLon = avgLocation.match(/Lat:\s*([\d\.\-]+),\s*Lon:\s*([\d\.\-]+)/);

                const mapIcon = latLon
                    ? `<img 
                        src="https://img.icons8.com/ios-filled/50/000000/map-pin.png" 
                        alt="Map Icon" 
                        class="map-icon" 
                        onclick="openMap(${latLon[1]}, ${latLon[2]})"
                       />`
                    : '';

                trainDiv.innerHTML = `
                    <h2>ট্রেনের নাম : ${train.trainName || 'N/A'}</h2>
                    <p><strong>অবস্থান :</strong> ${avgLocation}</p>
                    ${mapIcon}
                    <p><strong>গতি :</strong> ${train.avgSpeed.toFixed(2)} km/h</p>
                    ${
                        messages.length > 0
                            ? `
                            <p><strong>টেক্সট আপডেট :</strong></p>
                            <ul>
                                ${messages.slice(0, -1).map(msg => `<li>${msg}</li>`).join('')}
                                ${lastMessage}
                            </ul>
                            `
                            : ''
                    }
                    <p><strong>সর্বশেষ আপডেট হয়েছে :</strong> ${updatedTime}</p>
                `;

                trainContainer.appendChild(trainDiv);
            });
        }

        function openMap(lat, lon) {
            const mapUrl = `https://www.google.com/maps?q=${lat},${lon}`;
            window.location.href = mapUrl; // Navigate to the map in the same tab
        }

        function searchTrain() {
            const searchValue = document.getElementById('searchInput').value.trim().toLowerCase();
            const filteredTrains = trainData.filter(train => 
                train.trainName && train.trainName.toLowerCase().includes(searchValue)
            );
            displayTrains(filteredTrains);
        }

        // Fetch data on page load
        window.onload = fetchTrainData;