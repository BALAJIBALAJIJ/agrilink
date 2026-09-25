package com.agrilink.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "vegetableCatalog")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VegetableCatalog {

    @Id
    private String id;

    private String category;
    private String categoryTamil;

    private String name;
    private String nameTamil;

    private String imageUrl;
    private String description;

    private List<String> aliases; // Alternative names for search
}
