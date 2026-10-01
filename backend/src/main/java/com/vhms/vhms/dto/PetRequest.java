package com.vhms.vhms.dto;

public class PetRequest {
    private String ownerId;
    private String name;
    private String species;
    private String breed;
    private int age;
    private double weight;
    private String gender;
    private String photoUrl;
    private String dateOfBirth;

    public PetRequest() {
    }

    public PetRequest(String ownerId, String name, String species, String breed, int age, double weight, String gender,
            String photoUrl, String dateOfBirth) {
        this.ownerId = ownerId;
        this.name = name;
        this.species = species;
        this.breed = breed;
        this.age = age;
        this.weight = weight;
        this.gender = gender;
        this.photoUrl = photoUrl;
        this.dateOfBirth = dateOfBirth;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(String ownerId) {
        this.ownerId = ownerId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSpecies() {
        return species;
    }

    public void setSpecies(String species) {
        this.species = species;
    }

    public String getBreed() {
        return breed;
    }

    public void setBreed(String breed) {
        this.breed = breed;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public double getWeight() {
        return weight;
    }

    public void setWeight(double weight) {
        this.weight = weight;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public String getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(String dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }
}
