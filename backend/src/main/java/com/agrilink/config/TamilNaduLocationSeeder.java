package com.agrilink.config;

import com.agrilink.model.*;
import com.agrilink.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class TamilNaduLocationSeeder implements CommandLineRunner {

    private final DryUnitRepository dryUnitRepository;
    private final BiogasPlantRepository biogasPlantRepository;

    @Override
    public void run(String... args) {
        if (dryUnitRepository.count() == 0) {
            seedDryUnits();
            log.info("✅ Tamil Nadu Dry Units seeded: {} districts", dryUnitRepository.count());
        }
        if (biogasPlantRepository.count() == 0) {
            seedBiogasPlants();
            log.info("✅ Tamil Nadu Biogas Plants seeded: {} districts", biogasPlantRepository.count());
        }
    }

    private void seedDryUnits() {
        List<DryUnit> units = List.of(
            du("Erode Agro Processing Centre", "Erode", "Erode Central Agriculture Area", 11.3410, 77.7172, "04294-234567"),
            du("Salem Vegetable Drying Centre", "Salem", "Salem Agriculture Processing Area", 11.6643, 78.1460, "0427-2345678"),
            du("Coimbatore Agri Drying Unit", "Coimbatore", "Coimbatore APMC Yard", 11.0168, 76.9558, "0422-2345678"),
            du("Madurai Dry Processing Unit", "Madurai", "Madurai Periyar Bus Stand Area", 9.9252, 78.1198, "0452-2345678"),
            du("Trichy Agro Drying Centre", "Tiruchirappalli", "Trichy Chathram Bus Stand Area", 10.7905, 78.7047, "0431-2345678"),
            du("Tirunelveli Drying Unit", "Tirunelveli", "Tirunelveli Agricultural Market", 8.7139, 77.7567, "0462-2345678"),
            du("Thanjavur Rice Drying Centre", "Thanjavur", "Thanjavur Big Temple Area", 10.7870, 79.1378, "04362-234567"),
            du("Dindigul Agri Processing Unit", "Dindigul", "Dindigul Agricultural Zone", 10.3673, 77.9803, "0451-2345678"),
            du("Vellore Vegetable Drying Centre", "Vellore", "Vellore Agricultural Area", 12.9165, 79.1325, "0416-2345678"),
            du("Krishnagiri Agro Drying Unit", "Krishnagiri", "Krishnagiri Agricultural Market", 12.5186, 78.2138, "04343-234567"),
            du("Tiruppur Agri Processing Centre", "Tiruppur", "Tiruppur Industrial Area", 11.1085, 77.3411, "0421-2345678"),
            du("Kanyakumari Drying Unit", "Kanyakumari", "Nagercoil Agricultural Area", 8.1833, 77.4119, "04652-234567"),
            du("Villupuram Agro Drying Centre", "Villupuram", "Villupuram APMC Yard", 11.9401, 79.4861, "04146-234567"),
            du("Cuddalore Processing Centre", "Cuddalore", "Cuddalore Agricultural Zone", 11.7480, 79.7714, "04142-234567"),
            du("Namakkal Agri Drying Unit", "Namakkal", "Namakkal Agricultural Market", 11.2189, 78.1674, "04286-234567"),
            du("Dharmapuri Drying Centre", "Dharmapuri", "Dharmapuri Agricultural Area", 12.1211, 78.1582, "04342-234567"),
            du("Theni Agro Processing Unit", "Theni", "Theni Agricultural Market", 10.0104, 77.4768, "04546-234567"),
            du("Ramanathapuram Drying Centre", "Ramanathapuram", "Ramanathapuram Agricultural Zone", 9.3639, 78.8395, "04567-234567"),
            du("Sivagangai Processing Unit", "Sivagangai", "Sivagangai Agricultural Area", 10.0437, 78.5294, "04575-234567"),
            du("Virudhunagar Drying Centre", "Virudhunagar", "Virudhunagar Agricultural Market", 9.5851, 77.9513, "04562-234567"),
            du("Nagapattinam Processing Unit", "Nagapattinam", "Nagapattinam Agricultural Zone", 10.7672, 79.8449, "04365-234567"),
            du("Tiruvarur Drying Centre", "Tiruvarur", "Tiruvarur Agricultural Area", 10.7733, 79.6369, "04366-234567"),
            du("Perambalur Processing Unit", "Perambalur", "Perambalur Agricultural Market", 11.2340, 78.8804, "04328-234567"),
            du("Ariyalur Drying Centre", "Ariyalur", "Ariyalur Agricultural Zone", 11.1400, 79.0784, "04329-234567"),
            du("Karur Agri Processing Centre", "Karur", "Karur Agricultural Market", 10.9601, 78.0766, "04324-234567"),
            du("Pudukkottai Drying Unit", "Pudukkottai", "Pudukkottai Agricultural Area", 10.3833, 78.8001, "04322-234567"),
            du("Thoothukudi Processing Centre", "Thoothukudi", "Thoothukudi Agricultural Zone", 8.7642, 78.1348, "0461-2345678"),
            du("Nilgiris Drying Centre", "Nilgiris", "Ooty Agricultural Processing Area", 11.4064, 76.6932, "0423-2345678"),
            du("Kancheepuram Processing Unit", "Kancheepuram", "Kancheepuram Agricultural Market", 12.8342, 79.7036, "044-27234567"),
            du("Tiruvallur Drying Centre", "Tiruvallur", "Tiruvallur Agricultural Zone", 13.1431, 79.9083, "044-27654321"),
            du("Chengalpattu Processing Unit", "Chengalpattu", "Chengalpattu Agricultural Area", 12.6819, 79.9888, "044-27111111"),
            du("Ranipet Drying Centre", "Ranipet", "Ranipet Agricultural Market", 12.9320, 79.3333, "04172-234567"),
            du("Tirupattur Processing Unit", "Tirupattur", "Tirupattur Agricultural Zone", 12.4950, 78.5730, "04179-234567"),
            du("Kallakurichi Drying Centre", "Kallakurichi", "Kallakurichi Agricultural Area", 11.7380, 78.9591, "04151-234567"),
            du("Tenkasi Processing Unit", "Tenkasi", "Tenkasi Agricultural Market", 8.9604, 77.3152, "04633-234567"),
            du("Mayiladuthurai Drying Centre", "Mayiladuthurai", "Mayiladuthurai Agricultural Zone", 11.1018, 79.6539, "04364-234567"),
            du("Chennai Agro Processing Hub", "Chennai", "Chennai Koyambedu Market Area", 13.0827, 80.2707, "044-28234567"),
            du("Tiruvannamalai Drying Unit", "Tiruvannamalai", "Tiruvannamalai Agricultural Area", 12.2253, 79.0747, "04175-234567")
        );
        dryUnitRepository.saveAll(units);
    }

    private void seedBiogasPlants() {
        List<BiogasPlant> plants = List.of(
            bp("Erode Biogas Energy Plant", "Erode", "Erode Renewable Energy Zone", 11.3510, 77.7272, "04294-345678"),
            bp("Salem Green Energy Plant", "Salem", "Salem Industrial Area", 11.6743, 78.1560, "0427-3456789"),
            bp("Coimbatore Biogas Unit", "Coimbatore", "Coimbatore SIPCOT Area", 11.0268, 76.9658, "0422-3456789"),
            bp("Madurai Biogas Energy Centre", "Madurai", "Madurai Industrial Zone", 9.9352, 78.1298, "0452-3456789"),
            bp("Trichy Renewable Energy Plant", "Tiruchirappalli", "Trichy BHEL Township Area", 10.8005, 78.7147, "0431-3456789"),
            bp("Tirunelveli Biogas Plant", "Tirunelveli", "Tirunelveli Agricultural Outskirts", 8.7239, 77.7667, "0462-3456789"),
            bp("Thanjavur Biogas Unit", "Thanjavur", "Thanjavur Agricultural Belt", 10.7970, 79.1478, "04362-345678"),
            bp("Dindigul Organic Energy Plant", "Dindigul", "Dindigul Outskirts", 10.3773, 77.9903, "0451-3456789"),
            bp("Vellore Biogas Centre", "Vellore", "Vellore Industrial Zone", 12.9265, 79.1425, "0416-3456789"),
            bp("Krishnagiri Green Energy Unit", "Krishnagiri", "Krishnagiri Hosur Road", 12.5286, 78.2238, "04343-345678"),
            bp("Tiruppur Biogas Plant", "Tiruppur", "Tiruppur Waste Processing Zone", 11.1185, 77.3511, "0421-3456789"),
            bp("Kanyakumari Biogas Unit", "Kanyakumari", "Nagercoil Energy Zone", 8.1933, 77.4219, "04652-345678"),
            bp("Villupuram Biogas Centre", "Villupuram", "Villupuram Outskirts", 11.9501, 79.4961, "04146-345678"),
            bp("Cuddalore Biogas Plant", "Cuddalore", "Cuddalore SIPCOT Area", 11.7580, 79.7814, "04142-345678"),
            bp("Namakkal Biogas Unit", "Namakkal", "Namakkal Poultry Zone", 11.2289, 78.1774, "04286-345678"),
            bp("Dharmapuri Biogas Plant", "Dharmapuri", "Dharmapuri Forest Area", 12.1311, 78.1682, "04342-345678"),
            bp("Theni Biogas Unit", "Theni", "Theni Agricultural Zone", 10.0204, 77.4868, "04546-345678"),
            bp("Ramanathapuram Biogas Plant", "Ramanathapuram", "Ramanathapuram Outskirts", 9.3739, 78.8495, "04567-345678"),
            bp("Thoothukudi Biogas Centre", "Thoothukudi", "Thoothukudi Industrial Zone", 8.7742, 78.1448, "0461-3456789"),
            bp("Chennai Biogas Hub", "Chennai", "Chennai Perungudi Processing Zone", 12.9516, 80.2423, "044-29345678"),
            bp("Tiruvannamalai Biogas Plant", "Tiruvannamalai", "Tiruvannamalai Rural Area", 12.2353, 79.0847, "04175-345678"),
            bp("Karur Biogas Unit", "Karur", "Karur Industrial Area", 10.9701, 78.0866, "04324-345678"),
            bp("Pudukkottai Biogas Plant", "Pudukkottai", "Pudukkottai Rural Zone", 10.3933, 78.8101, "04322-345678"),
            bp("Nilgiris Biogas Unit", "Nilgiris", "Coonoor Agricultural Zone", 11.3530, 76.7957, "0423-3456789"),
            bp("Sivagangai Biogas Plant", "Sivagangai", "Sivagangai Outskirts", 10.0537, 78.5394, "04575-345678"),
            bp("Virudhunagar Biogas Unit", "Virudhunagar", "Virudhunagar Industrial Zone", 9.5951, 77.9613, "04562-345678"),
            bp("Nagapattinam Biogas Plant", "Nagapattinam", "Nagapattinam Coastal Area", 10.7772, 79.8549, "04365-345678"),
            bp("Tiruvarur Biogas Unit", "Tiruvarur", "Tiruvarur Agricultural Belt", 10.7833, 79.6469, "04366-345678"),
            bp("Kancheepuram Biogas Plant", "Kancheepuram", "Kancheepuram Industrial Area", 12.8442, 79.7136, "044-27345678"),
            bp("Tiruvallur Biogas Unit", "Tiruvallur", "Tiruvallur Outskirts", 13.1531, 79.9183, "044-27765432"),
            bp("Chengalpattu Biogas Plant", "Chengalpattu", "Chengalpattu Rural Zone", 12.6919, 79.9988, "044-27222222"),
            bp("Ranipet Biogas Unit", "Ranipet", "Ranipet Industrial Zone", 12.9420, 79.3433, "04172-345678"),
            bp("Tenkasi Biogas Plant", "Tenkasi", "Tenkasi Agricultural Zone", 8.9704, 77.3252, "04633-345678"),
            bp("Mayiladuthurai Biogas Unit", "Mayiladuthurai", "Mayiladuthurai Rural Area", 11.1118, 79.6639, "04364-345678"),
            bp("Kallakurichi Biogas Plant", "Kallakurichi", "Kallakurichi Outskirts", 11.7480, 78.9691, "04151-345678"),
            bp("Tirupattur Biogas Unit", "Tirupattur", "Tirupattur Forest Fringe", 12.5050, 78.5830, "04179-345678"),
            bp("Ariyalur Biogas Plant", "Ariyalur", "Ariyalur Cement Zone", 11.1500, 79.0884, "04329-345678"),
            bp("Perambalur Biogas Unit", "Perambalur", "Perambalur Agricultural Zone", 11.2440, 78.8904, "04328-345678")
        );
        biogasPlantRepository.saveAll(plants);
    }

    private DryUnit du(String name, String district, String address, double lat, double lon, String phone) {
        return DryUnit.builder().name(name).district(district).address(address)
                .location(GeoLocation.builder().latitude(lat).longitude(lon).address(address).district(district).state("Tamil Nadu").build())
                .contactNumber(phone).contactPerson(district + " Manager").processingCapacityKg(5000).active(true).build();
    }

    private BiogasPlant bp(String name, String district, String address, double lat, double lon, String phone) {
        return BiogasPlant.builder().name(name).district(district).address(address)
                .location(GeoLocation.builder().latitude(lat).longitude(lon).address(address).district(district).state("Tamil Nadu").build())
                .contactNumber(phone).contactPerson(district + " Manager").processingCapacityKg(10000).active(true).build();
    }
}
